# 社員離職予知サービス 技術仕様書

## 1. システムアーキテクチャ詳細

### 1.1 マイクロサービスアーキテクチャ

```
┌─────────────────────────────────────────────────────────────────────┐
│                           API Gateway (Kong/AWS API Gateway)          │
└─────────────────────────────────────────────────────────────────────┘
                                    │
    ┌───────────────┬───────────────┼───────────────┬───────────────┐
    ▼               ▼               ▼               ▼               ▼
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Auth   │    │  User   │    │Prediction│    │Analytics│    │ Report  │
│ Service │    │ Service │    │ Service │    │ Service │    │ Service │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
    │               │               │               │               │
    └───────────────┴───────────────┴───────────────┴───────────────┘
                                    │
                            ┌───────────────┐
                            │ Message Queue │
                            │   (Kafka)     │
                            └───────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
            ┌─────────────┐                 ┌─────────────┐
            │  ML Pipeline│                 │ Data ETL    │
            │  Service    │                 │ Service     │
            └─────────────┘                 └─────────────┘
```

### 1.2 データフローアーキテクチャ

```
入力データソース                  処理層                    出力層
┌──────────────┐
│ HRシステム    │──┐
├──────────────┤  │    ┌──────────────┐    ┌──────────────┐
│ 勤怠システム  │──┼───▶│ Data Lake    │───▶│ Feature Store│
├──────────────┤  │    │ (Raw Data)   │    │              │
│ サーベイ      │──┘    └──────────────┘    └──────────────┘
└──────────────┘              │                     │
                              ▼                     ▼
                        ┌──────────────┐    ┌──────────────┐
                        │ Data         │    │ ML Training  │
                        │ Warehouse    │───▶│ Pipeline     │
                        └──────────────┘    └──────────────┘
                              │                     │
                              ▼                     ▼
                        ┌──────────────┐    ┌──────────────┐
                        │ Analytics    │    │ Model        │
                        │ Engine       │◀───│ Registry     │
                        └──────────────┘    └──────────────┘
```

## 2. データベース設計

### 2.1 主要テーブル設計

#### employees（社員マスタ）

```sql
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department_id UUID REFERENCES departments(id),
    position_id UUID REFERENCES positions(id),
    hire_date DATE NOT NULL,
    birth_date DATE,
    gender VARCHAR(10),
    employment_type VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_hire_date ON employees(hire_date);
```

#### predictions（予測結果）

```sql
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id),
    prediction_date DATE NOT NULL,
    risk_score DECIMAL(5,2) CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level VARCHAR(20) CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    prediction_period VARCHAR(20) CHECK (prediction_period IN ('3_MONTHS', '6_MONTHS', '12_MONTHS')),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    model_version VARCHAR(50),
    is_latest BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_predictions_employee_date ON predictions(employee_id, prediction_date DESC);
CREATE INDEX idx_predictions_risk_level ON predictions(risk_level) WHERE is_latest = true;
```

#### risk_factors（リスク要因）

```sql
CREATE TABLE risk_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id UUID REFERENCES predictions(id),
    factor_type VARCHAR(50) NOT NULL,
    factor_name VARCHAR(100) NOT NULL,
    impact_score DECIMAL(3,2) CHECK (impact_score >= 0 AND impact_score <= 1),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_risk_factors_prediction ON risk_factors(prediction_id);
CREATE INDEX idx_risk_factors_type ON risk_factors(factor_type);
```

#### attendance_records（勤怠記録）

```sql
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id),
    work_date DATE NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    work_hours DECIMAL(4,2),
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    is_remote BOOLEAN DEFAULT false,
    is_holiday BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attendance_employee_date ON attendance_records(employee_id, work_date DESC);
CREATE INDEX idx_attendance_overtime ON attendance_records(overtime_hours) WHERE overtime_hours > 0;
```

#### engagement_surveys（エンゲージメントサーベイ）

```sql
CREATE TABLE engagement_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id),
    survey_date DATE NOT NULL,
    overall_score DECIMAL(3,2) CHECK (overall_score >= 0 AND overall_score <= 10),
    work_life_balance_score DECIMAL(3,2),
    career_growth_score DECIMAL(3,2),
    manager_relationship_score DECIMAL(3,2),
    team_collaboration_score DECIMAL(3,2),
    compensation_satisfaction_score DECIMAL(3,2),
    responses JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_surveys_employee_date ON engagement_surveys(employee_id, survey_date DESC);
```

### 2.2 時系列データ用テーブル（TimescaleDB）

```sql
-- ハイパーテーブルの作成
CREATE TABLE employee_metrics (
    time TIMESTAMPTZ NOT NULL,
    employee_id UUID NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_value DECIMAL(10,2),
    metadata JSONB,
    PRIMARY KEY (employee_id, metric_type, time)
);

SELECT create_hypertable('employee_metrics', 'time');

-- 継続的集約の設定
CREATE MATERIALIZED VIEW employee_metrics_daily
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', time) AS day,
    employee_id,
    metric_type,
    AVG(metric_value) as avg_value,
    MIN(metric_value) as min_value,
    MAX(metric_value) as max_value
FROM employee_metrics
GROUP BY day, employee_id, metric_type;
```

## 3. API 詳細仕様

### 3.1 認証・認可

#### JWT Token 構造

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_id",
    "email": "user@example.com",
    "roles": ["HR_MANAGER", "VIEWER"],
    "permissions": ["view_predictions", "manage_employees"],
    "department_ids": ["dept_1", "dept_2"],
    "iat": 1516239022,
    "exp": 1516242622
  }
}
```

#### 認証フロー

```
1. POST /api/auth/login
   Request:
   {
     "email": "user@example.com",
     "password": "encrypted_password"
   }

   Response:
   {
     "access_token": "eyJhbGciOiJSUzI1NiIs...",
     "refresh_token": "dGhpc2lzYXJlZnJlc2h0b2tlbg...",
     "expires_in": 3600,
     "token_type": "Bearer"
   }

2. Authorization Header:
   Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

### 3.2 予測エンドポイント

#### 個別社員の予測取得

```
GET /api/v1/predictions/employees/{employee_id}
Query Parameters:
  - period: 3_MONTHS | 6_MONTHS | 12_MONTHS
  - include_history: boolean

Response:
{
  "employee_id": "123e4567-e89b-12d3-a456-426614174000",
  "current_prediction": {
    "risk_score": 75.5,
    "risk_level": "HIGH",
    "confidence": 0.82,
    "prediction_date": "2024-01-15",
    "top_factors": [
      {
        "factor": "overtime_increase",
        "impact": 0.35,
        "trend": "INCREASING",
        "description": "残業時間が過去3ヶ月で40%増加"
      }
    ]
  },
  "recommended_actions": [
    {
      "action_id": "ACT001",
      "type": "WORKLOAD_REVIEW",
      "priority": "HIGH",
      "description": "業務量の見直しと再配分",
      "expected_impact": 0.25
    }
  ],
  "history": [...]
}
```

#### バッチ予測実行

```
POST /api/v1/predictions/batch
Request:
{
  "employee_ids": ["id1", "id2", "id3"],
  "department_ids": ["dept1"],
  "prediction_period": "6_MONTHS",
  "async": true
}

Response:
{
  "job_id": "job_123456",
  "status": "PROCESSING",
  "estimated_completion": "2024-01-15T10:30:00Z",
  "webhook_url": "https://api.example.com/webhooks/predictions/job_123456"
}
```

### 3.3 分析エンドポイント

#### リスク要因分析

```
GET /api/v1/analytics/risk-factors
Query Parameters:
  - department_id: UUID
  - start_date: YYYY-MM-DD
  - end_date: YYYY-MM-DD
  - group_by: DEPARTMENT | POSITION | AGE_GROUP

Response:
{
  "analysis_period": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "total_employees": 500,
  "risk_distribution": {
    "high": 50,
    "medium": 150,
    "low": 300
  },
  "top_risk_factors": [
    {
      "factor": "work_life_balance",
      "affected_employees": 120,
      "average_impact": 0.28,
      "departments_most_affected": ["Sales", "Engineering"]
    }
  ],
  "trends": {
    "risk_score_change": "+5.2%",
    "new_high_risk": 15,
    "resolved_high_risk": 8
  }
}
```

### 3.4 WebSocket リアルタイム通知

```javascript
// WebSocket接続
const ws = new WebSocket("wss://api.example.com/ws/notifications");

// 認証
ws.onopen = () => {
  ws.send(
    JSON.stringify({
      type: "auth",
      token: "jwt_token_here",
    })
  );
};

// 通知受信
ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  /*
  {
    "type": "HIGH_RISK_ALERT",
    "employee_id": "123",
    "risk_score": 85,
    "message": "山田太郎さんの離職リスクが高まっています",
    "timestamp": "2024-01-15T09:30:00Z"
  }
  */
};
```

## 4. 機械学習パイプライン詳細

### 4.1 特徴量エンジニアリング

```python
class FeatureEngineering:
    def __init__(self):
        self.feature_groups = {
            'demographics': ['age', 'tenure', 'gender', 'education_level'],
            'performance': ['last_rating', 'avg_rating_3m', 'rating_trend'],
            'attendance': ['avg_overtime_3m', 'sick_days_6m', 'vacation_usage_rate'],
            'engagement': ['survey_score', 'survey_trend', 'response_rate'],
            'compensation': ['salary_percentile', 'last_raise_months', 'bonus_ratio'],
            'activity': ['email_frequency', 'meeting_participation', 'project_count']
        }

    def create_features(self, employee_data):
        features = {}

        # 基本特徴量
        features.update(self._extract_basic_features(employee_data))

        # 時系列特徴量
        features.update(self._extract_time_series_features(employee_data))

        # 相対的特徴量
        features.update(self._extract_relative_features(employee_data))

        # テキスト特徴量（1on1メモ、サーベイコメント）
        features.update(self._extract_text_features(employee_data))

        return features
```

### 4.2 モデルアーキテクチャ

```python
class RetentionPredictionModel:
    def __init__(self):
        # アンサンブルモデルの定義
        self.models = {
            'rf': RandomForestClassifier(
                n_estimators=200,
                max_depth=10,
                min_samples_split=50
            ),
            'xgb': XGBClassifier(
                n_estimators=200,
                max_depth=6,
                learning_rate=0.01,
                scale_pos_weight=3  # 不均衡データ対策
            ),
            'nn': self._build_neural_network()
        }

        # メタ学習器
        self.meta_learner = LogisticRegression()

    def _build_neural_network(self):
        model = Sequential([
            Dense(128, activation='relu', input_shape=(n_features,)),
            Dropout(0.3),
            Dense(64, activation='relu'),
            Dropout(0.3),
            Dense(32, activation='relu'),
            Dense(1, activation='sigmoid')
        ])
        model.compile(
            optimizer='adam',
            loss='binary_focal_loss',  # 不均衡データ対策
            metrics=['auc']
        )
        return model
```

### 4.3 モデル評価・監視

```python
class ModelMonitoring:
    def __init__(self):
        self.metrics = {
            'classification': ['auc_roc', 'precision', 'recall', 'f1'],
            'calibration': ['brier_score', 'calibration_error'],
            'fairness': ['demographic_parity', 'equal_opportunity'],
            'drift': ['psi', 'feature_drift_score']
        }

    def evaluate_model(self, model, X_test, y_test, sensitive_attributes):
        results = {}

        # 予測性能
        y_pred = model.predict_proba(X_test)[:, 1]
        results['auc_roc'] = roc_auc_score(y_test, y_pred)

        # キャリブレーション
        results['calibration_error'] = self._calculate_calibration_error(y_test, y_pred)

        # 公平性評価
        results['fairness_metrics'] = self._evaluate_fairness(
            y_test, y_pred, sensitive_attributes
        )

        # ドリフト検出
        results['drift_detected'] = self._detect_drift(X_test)

        return results
```

## 5. インフラストラクチャ仕様

### 5.1 Kubernetes 構成

```yaml
# Deployment設定例
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prediction-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: prediction-service
  template:
    metadata:
      labels:
        app: prediction-service
    spec:
      containers:
        - name: prediction-service
          image: erps/prediction-service:latest
          ports:
            - containerPort: 8080
          resources:
            requests:
              memory: "512Mi"
              cpu: "500m"
            limits:
              memory: "1Gi"
              cpu: "1000m"
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: url
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
```

### 5.2 監視・ロギング

```yaml
# Prometheus設定
scrape_configs:
  - job_name: "erps-services"
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        action: keep
        regex: erps-.*
    metrics_path: /metrics
```

```json
// ログフォーマット
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "service": "prediction-service",
  "trace_id": "abc123",
  "user_id": "user456",
  "action": "predict_risk",
  "employee_id": "emp789",
  "duration_ms": 245,
  "result": {
    "risk_score": 75,
    "status": "success"
  }
}
```

### 5.3 CI/CD パイプライン

```yaml
# GitHub Actions設定
name: ERPS CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Run Unit Tests
        run: |
          npm test
          python -m pytest tests/

      - name: Run Integration Tests
        run: |
          docker-compose -f docker-compose.test.yml up --abort-on-container-exit

      - name: Security Scan
        uses: aquasecurity/trivy-action@master

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Kubernetes
        run: |
          kubectl apply -f k8s/
          kubectl rollout status deployment/prediction-service
```

## 6. セキュリティ仕様

### 6.1 データ暗号化

```python
# 暗号化実装例
from cryptography.fernet import Fernet
import hashlib

class DataEncryption:
    def __init__(self, master_key):
        self.fernet = Fernet(master_key)

    def encrypt_pii(self, data):
        """個人識別情報の暗号化"""
        if isinstance(data, str):
            return self.fernet.encrypt(data.encode()).decode()
        return data

    def hash_identifier(self, identifier):
        """識別子の一方向ハッシュ化"""
        return hashlib.sha256(identifier.encode()).hexdigest()
```

### 6.2 アクセス制御

```python
# RBAC実装例
class RoleBasedAccessControl:
    def __init__(self):
        self.permissions = {
            'HR_ADMIN': [
                'view_all_predictions',
                'manage_employees',
                'export_data',
                'configure_system'
            ],
            'HR_MANAGER': [
                'view_department_predictions',
                'view_employee_details',
                'create_reports'
            ],
            'DEPARTMENT_MANAGER': [
                'view_team_predictions',
                'view_team_analytics'
            ]
        }

    def check_permission(self, user_role, action, resource):
        """権限チェック"""
        if action in self.permissions.get(user_role, []):
            return self._check_resource_access(user_role, resource)
        return False
```

## 7. パフォーマンス最適化

### 7.1 キャッシング戦略

```python
# Redis キャッシング実装
class PredictionCache:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.ttl = {
            'prediction': 3600,  # 1時間
            'analytics': 1800,   # 30分
            'report': 86400      # 24時間
        }

    def get_prediction(self, employee_id):
        key = f"prediction:{employee_id}"
        cached = self.redis.get(key)
        if cached:
            return json.loads(cached)
        return None

    def set_prediction(self, employee_id, prediction):
        key = f"prediction:{employee_id}"
        self.redis.setex(
            key,
            self.ttl['prediction'],
            json.dumps(prediction)
        )
```

### 7.2 データベース最適化

```sql
-- パーティショニング
CREATE TABLE predictions_2024 PARTITION OF predictions
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- インデックス戦略
CREATE INDEX CONCURRENTLY idx_predictions_composite
ON predictions(employee_id, prediction_date DESC)
WHERE is_latest = true;

-- マテリアライズドビュー
CREATE MATERIALIZED VIEW risk_summary AS
SELECT
    d.name as department,
    COUNT(*) FILTER (WHERE p.risk_level = 'HIGH') as high_risk_count,
    COUNT(*) FILTER (WHERE p.risk_level = 'MEDIUM') as medium_risk_count,
    COUNT(*) FILTER (WHERE p.risk_level = 'LOW') as low_risk_count,
    AVG(p.risk_score) as avg_risk_score
FROM predictions p
JOIN employees e ON p.employee_id = e.id
JOIN departments d ON e.department_id = d.id
WHERE p.is_latest = true
GROUP BY d.id, d.name;

CREATE UNIQUE INDEX ON risk_summary(department);
```

## 8. 災害復旧計画

### 8.1 バックアップ戦略

```bash
# 自動バックアップスクリプト
#!/bin/bash
# Daily backup script

# データベースバックアップ
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME | \
  gzip > /backup/db/erps_$(date +%Y%m%d_%H%M%S).sql.gz

# S3へのアップロード
aws s3 cp /backup/db/erps_$(date +%Y%m%d)*.sql.gz \
  s3://erps-backups/daily/ --storage-class GLACIER

# 古いバックアップの削除（30日以上）
find /backup/db -name "*.sql.gz" -mtime +30 -delete
```

### 8.2 復旧手順

```yaml
# 災害復旧プレイブック
recovery_procedures:
  database:
    - step: "最新のバックアップを特定"
      command: "aws s3 ls s3://erps-backups/daily/ --recursive | sort | tail -1"

    - step: "バックアップをダウンロード"
      command: "aws s3 cp s3://erps-backups/daily/latest.sql.gz ."

    - step: "データベースを復元"
      command: "gunzip -c latest.sql.gz | psql -h $NEW_DB_HOST -U $DB_USER -d $DB_NAME"

    - step: "データ整合性チェック"
      command: "python scripts/verify_data_integrity.py"

  estimated_recovery_time: "2-4 hours"
  recovery_point_objective: "24 hours"
```
