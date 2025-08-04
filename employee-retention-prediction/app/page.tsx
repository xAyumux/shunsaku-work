"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Target,
  Search,
  Filter,
  Bell,
  BarChart3,
  PieChart,
  Download,
} from "lucide-react"

// Mock data
const mockEmployees = [
  {
    id: "EMP001",
    name: "田中 太郎",
    department: "営業部",
    position: "主任",
    riskScore: 85,
    riskLevel: "HIGH",
    joinDate: "2020-04-01",
    age: 32,
    topRiskFactors: [
      { factor: "ワークライフバランス", impact: 0.3 },
      { factor: "キャリア成長", impact: 0.25 },
      { factor: "上司との関係", impact: 0.2 },
    ],
  },
  {
    id: "EMP002",
    name: "佐藤 花子",
    department: "開発部",
    position: "シニアエンジニア",
    riskScore: 45,
    riskLevel: "MEDIUM",
    joinDate: "2019-07-15",
    age: 28,
    topRiskFactors: [
      { factor: "報酬・待遇", impact: 0.35 },
      { factor: "スキルマッチ", impact: 0.15 },
    ],
  },
  {
    id: "EMP003",
    name: "鈴木 一郎",
    department: "人事部",
    position: "マネージャー",
    riskScore: 25,
    riskLevel: "LOW",
    joinDate: "2018-03-01",
    age: 35,
    topRiskFactors: [{ factor: "職場環境", impact: 0.1 }],
  },
  {
    id: "EMP004",
    name: "山田 美咲",
    department: "マーケティング部",
    position: "スペシャリスト",
    riskScore: 72,
    riskLevel: "HIGH",
    joinDate: "2021-01-10",
    age: 29,
    topRiskFactors: [
      { factor: "キャリア成長", impact: 0.4 },
      { factor: "労働時間", impact: 0.25 },
    ],
  },
]

const departmentStats = [
  { name: "営業部", total: 45, high: 8, medium: 15, low: 22 },
  { name: "開発部", total: 32, high: 3, medium: 12, low: 17 },
  { name: "人事部", total: 12, high: 1, medium: 4, low: 7 },
  { name: "マーケティング部", total: 28, high: 6, medium: 10, low: 12 },
]

const riskFactors = [
  { factor: "ワークライフバランス", percentage: 35 },
  { factor: "キャリア成長", percentage: 28 },
  { factor: "報酬・待遇", percentage: 22 },
  { factor: "上司との関係", percentage: 18 },
  { factor: "労働時間", percentage: 15 },
  { factor: "職場環境", percentage: 12 },
]

function getRiskBadgeColor(level: string) {
  switch (level) {
    case "HIGH":
      return "destructive"
    case "MEDIUM":
      return "default"
    case "LOW":
      return "secondary"
    default:
      return "default"
  }
}

function getRiskLevelText(level: string) {
  switch (level) {
    case "HIGH":
      return "高リスク"
    case "MEDIUM":
      return "中リスク"
    case "LOW":
      return "低リスク"
    default:
      return level
  }
}

export default function EmployeeRetentionDashboard() {
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")

  const filteredEmployees = mockEmployees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = departmentFilter === "all" || emp.department === departmentFilter
    return matchesSearch && matchesDepartment
  })

  const totalEmployees = mockEmployees.length
  const highRiskCount = mockEmployees.filter((emp) => emp.riskLevel === "HIGH").length
  const mediumRiskCount = mockEmployees.filter((emp) => emp.riskLevel === "MEDIUM").length
  const lowRiskCount = mockEmployees.filter((emp) => emp.riskLevel === "LOW").length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">社員離職予知システム (ERPS)</h1>
            <p className="text-gray-600">Employee Retention Prediction System</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              レポート出力
            </Button>
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              通知設定
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Alert for high-risk employees */}
        {highRiskCount > 0 && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>{highRiskCount}名</strong>の社員が高リスク状態です。早急な対応をお勧めします。
            </AlertDescription>
          </Alert>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総社員数</CardTitle>
              <Users className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEmployees}</div>
              <p className="text-xs text-gray-600">前月比 +2名</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">高リスク社員</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{highRiskCount}</div>
              <p className="text-xs text-gray-600">全体の {Math.round((highRiskCount / totalEmployees) * 100)}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">中リスク社員</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{mediumRiskCount}</div>
              <p className="text-xs text-gray-600">全体の {Math.round((mediumRiskCount / totalEmployees) * 100)}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">低リスク社員</CardTitle>
              <Target className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{lowRiskCount}</div>
              <p className="text-xs text-gray-600">全体の {Math.round((lowRiskCount / totalEmployees) * 100)}%</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">ダッシュボード</TabsTrigger>
            <TabsTrigger value="employees">社員一覧</TabsTrigger>
            <TabsTrigger value="analytics">分析</TabsTrigger>
            <TabsTrigger value="recommendations">推奨アクション</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Department Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    部門別リスク分布
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {departmentStats.map((dept) => (
                      <div key={dept.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{dept.name}</span>
                          <span className="text-sm text-gray-600">計{dept.total}名</span>
                        </div>
                        <div className="flex gap-1">
                          <div
                            className="bg-red-500 h-2 rounded-l"
                            style={{ width: `${(dept.high / dept.total) * 100}%` }}
                          />
                          <div
                            className="bg-orange-500 h-2"
                            style={{ width: `${(dept.medium / dept.total) * 100}%` }}
                          />
                          <div
                            className="bg-green-500 h-2 rounded-r"
                            style={{ width: `${(dept.low / dept.total) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>高: {dept.high}</span>
                          <span>中: {dept.medium}</span>
                          <span>低: {dept.low}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Factors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    主要リスク要因
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {riskFactors.map((factor) => (
                      <div key={factor.factor} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">{factor.factor}</span>
                          <span className="text-sm text-gray-600">{factor.percentage}%</span>
                        </div>
                        <Progress value={factor.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            {/* Search and Filter */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="社員名または部署で検索..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="部署で絞り込み" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部署</SelectItem>
                      <SelectItem value="営業部">営業部</SelectItem>
                      <SelectItem value="開発部">開発部</SelectItem>
                      <SelectItem value="人事部">人事部</SelectItem>
                      <SelectItem value="マーケティング部">マーケティング部</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Employee List */}
            <div className="grid gap-4">
              {filteredEmployees.map((employee) => (
                <Card key={employee.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="font-semibold text-gray-600">{employee.name.charAt(0)}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{employee.name}</h3>
                          <p className="text-sm text-gray-600">
                            {employee.department} • {employee.position}
                          </p>
                          <p className="text-xs text-gray-500">
                            入社日: {employee.joinDate} • 年齢: {employee.age}歳
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getRiskBadgeColor(employee.riskLevel)}>
                            {getRiskLevelText(employee.riskLevel)}
                          </Badge>
                          <span className="text-2xl font-bold">{employee.riskScore}</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setSelectedEmployee(employee.id)}>
                          詳細を見る
                        </Button>
                      </div>
                    </div>
                    {employee.riskLevel === "HIGH" && (
                      <div className="mt-4 p-3 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-800 font-medium">主要リスク要因:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {employee.topRiskFactors.slice(0, 3).map((factor, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {factor.factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>離職リスクトレンド</CardTitle>
                  <CardDescription>過去6ヶ月の推移</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>トレンドチャートを表示</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>年齢層別リスク分析</CardTitle>
                  <CardDescription>年代別の離職リスク傾向</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>20代</span>
                      <div className="flex items-center gap-2">
                        <Progress value={65} className="w-24 h-2" />
                        <span className="text-sm">65%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>30代</span>
                      <div className="flex items-center gap-2">
                        <Progress value={45} className="w-24 h-2" />
                        <span className="text-sm">45%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>40代</span>
                      <div className="flex items-center gap-2">
                        <Progress value={25} className="w-24 h-2" />
                        <span className="text-sm">25%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>50代以上</span>
                      <div className="flex items-center gap-2">
                        <Progress value={15} className="w-24 h-2" />
                        <span className="text-sm">15%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <div className="grid gap-6">
              {mockEmployees
                .filter((emp) => emp.riskLevel === "HIGH")
                .map((employee) => (
                  <Card key={employee.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{employee.name} への推奨アクション</span>
                        <Badge variant="destructive">高リスク</Badge>
                      </CardTitle>
                      <CardDescription>
                        リスクスコア: {employee.riskScore} | 部署: {employee.department}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-semibold text-blue-900 mb-2">🎯 優先度: 高 - 1on1面談の実施</h4>
                          <p className="text-blue-800 text-sm mb-2">
                            上司との1on1面談を2週間以内に実施し、現在の悩みや要望をヒアリング
                          </p>
                          <p className="text-xs text-blue-600">期待される効果: リスクスコア -20ポイント</p>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg">
                          <h4 className="font-semibold text-green-900 mb-2">📚 優先度: 中 - キャリア開発プログラム</h4>
                          <p className="text-green-800 text-sm mb-2">スキルアップ研修やキャリアパス相談の機会を提供</p>
                          <p className="text-xs text-green-600">期待される効果: リスクスコア -15ポイント</p>
                        </div>

                        <div className="p-4 bg-orange-50 rounded-lg">
                          <h4 className="font-semibold text-orange-900 mb-2">
                            ⚖️ 優先度: 中 - ワークライフバランス改善
                          </h4>
                          <p className="text-orange-800 text-sm mb-2">
                            フレックスタイム制度やリモートワークの活用を提案
                          </p>
                          <p className="text-xs text-orange-600">期待される効果: リスクスコア -10ポイント</p>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button size="sm">アクション実行</Button>
                          <Button variant="outline" size="sm">
                            詳細分析
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
