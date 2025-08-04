"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Slack,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Users,
  MessageSquare,
  Shield,
  RefreshCw,
  Unlink,
  ArrowLeft,
  Info,
} from "lucide-react"
import Link from "next/link"

// Mock data for demonstration
const mockSlackChannels = [
  { id: "C1234567890", name: "general", memberCount: 45, isPrivate: false },
  { id: "C2345678901", name: "random", memberCount: 32, isPrivate: false },
  { id: "C3456789012", name: "engineering", memberCount: 15, isPrivate: false },
  { id: "C4567890123", name: "hr-team", memberCount: 8, isPrivate: true },
  { id: "C5678901234", name: "management", memberCount: 12, isPrivate: true },
  { id: "C6789012345", name: "project-alpha", memberCount: 6, isPrivate: false },
]

const requiredPermissions = [
  {
    scope: "channels:read",
    name: "チャンネル情報の読み取り",
    description: "パブリックチャンネルの一覧と基本情報を取得します",
    required: true,
  },
  {
    scope: "channels:history",
    name: "チャンネル履歴の読み取り",
    description: "パブリックチャンネルのメッセージ履歴を読み取ります",
    required: true,
  },
  {
    scope: "groups:read",
    name: "プライベートチャンネル情報の読み取り",
    description: "プライベートチャンネルの一覧と基本情報を取得します",
    required: false,
  },
  {
    scope: "groups:history",
    name: "プライベートチャンネル履歴の読み取り",
    description: "プライベートチャンネルのメッセージ履歴を読み取ります",
    required: false,
  },
  {
    scope: "users:read",
    name: "ユーザー情報の読み取り",
    description: "ワークスペースのユーザー情報を取得します",
    required: true,
  },
  {
    scope: "team:read",
    name: "ワークスペース情報の読み取り",
    description: "ワークスペースの基本情報を取得します",
    required: true,
  },
]

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error"

export default function SlackIntegrationPage() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected")
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [includePrivateChannels, setIncludePrivateChannels] = useState(false)
  const [dataRetentionDays, setDataRetentionDays] = useState("30")
  const [error, setError] = useState<string | null>(null)
  const [isReconnecting, setIsReconnecting] = useState(false)

  const handleConnect = async () => {
    setConnectionStatus("connecting")
    setError(null)

    // Simulate OAuth flow
    try {
      // In a real implementation, this would redirect to Slack OAuth
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate random success/failure for demo
      if (Math.random() > 0.2) {
        setConnectionStatus("connected")
      } else {
        throw new Error("認証に失敗しました。再度お試しください。")
      }
    } catch (err) {
      setConnectionStatus("error")
      setError(err instanceof Error ? err.message : "接続エラーが発生しました")
    }
  }

  const handleDisconnect = async () => {
    setConnectionStatus("disconnected")
    setSelectedChannels([])
    setError(null)
  }

  const handleReconnect = async () => {
    setIsReconnecting(true)
    setError(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setConnectionStatus("connected")
    } catch (err) {
      setError("再接続に失敗しました")
    } finally {
      setIsReconnecting(false)
    }
  }

  const handleChannelToggle = (channelId: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId],
    )
  }

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case "connected":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            接続済み
          </Badge>
        )
      case "connecting":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            接続中
          </Badge>
        )
      case "error":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            エラー
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            <XCircle className="h-3 w-3 mr-1" />
            未接続
          </Badge>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              ダッシュボードに戻る
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Slack className="h-6 w-6 text-purple-600" />
              Slack連携設定
            </h1>
            <p className="text-gray-600">Slackをデータソースとして連携し、社員のコミュニケーション分析を行います</p>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Connection Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                接続状況
              </span>
              {getStatusBadge()}
            </CardTitle>
            <CardDescription>現在のSlackワークスペースとの接続状況を確認できます</CardDescription>
          </CardHeader>
          <CardContent>
            {connectionStatus === "disconnected" && (
              <div className="text-center py-8">
                <Slack className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Slackワークスペースに接続</h3>
                <p className="text-gray-600 mb-6">
                  Slackアカウントを接続して、チームのコミュニケーションデータを分析に活用しましょう
                </p>
                <Button onClick={handleConnect} className="bg-purple-600 hover:bg-purple-700">
                  <Slack className="h-4 w-4 mr-2" />
                  Slackに接続
                </Button>
              </div>
            )}

            {connectionStatus === "connecting" && (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold mb-2">接続中...</h3>
                <p className="text-gray-600">Slackの認証画面が開きます。しばらくお待ちください。</p>
                <Progress value={66} className="w-64 mx-auto mt-4" />
              </div>
            )}

            {connectionStatus === "connected" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-green-900">接続完了</h3>
                      <p className="text-sm text-green-700">ワークスペース: Example Company</p>
                      <p className="text-xs text-green-600">最終同期: 2024年1月15日 14:30</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleReconnect} disabled={isReconnecting}>
                      {isReconnecting ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      再接続
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDisconnect}>
                      <Unlink className="h-4 w-4 mr-2" />
                      切断
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {connectionStatus === "error" && error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>接続エラー:</strong> {error}
                  <div className="mt-2">
                    <Button variant="outline" size="sm" onClick={handleConnect}>
                      再試行
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Permissions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              必要な権限
            </CardTitle>
            <CardDescription>
              Slackとの連携に必要な権限の詳細です。データの安全性とプライバシーを最優先に考慮しています。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requiredPermissions.map((permission) => (
                <div key={permission.scope} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="mt-1">
                    {permission.required ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Info className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{permission.name}</span>
                      <Badge variant={permission.required ? "default" : "secondary"} className="text-xs">
                        {permission.required ? "必須" : "オプション"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{permission.description}</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 inline-block">{permission.scope}</code>
                  </div>
                </div>
              ))}
            </div>

            <Alert className="mt-4 border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>プライバシーについて:</strong>
                取得したデータは暗号化され、分析目的でのみ使用されます。個人を特定できる情報は匿名化処理を行います。
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Data Source Configuration */}
        {connectionStatus === "connected" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                データ取得設定
              </CardTitle>
              <CardDescription>分析に使用するチャンネルとデータの取得設定を行います</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Channel Selection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">チャンネル選択</h3>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="private-channels"
                      checked={includePrivateChannels}
                      onCheckedChange={setIncludePrivateChannels}
                    />
                    <label htmlFor="private-channels" className="text-sm">
                      プライベートチャンネルを含む
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {mockSlackChannels
                    .filter((channel) => includePrivateChannels || !channel.isPrivate)
                    .map((channel) => (
                      <div key={channel.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          id={channel.id}
                          checked={selectedChannels.includes(channel.id)}
                          onCheckedChange={() => handleChannelToggle(channel.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">#{channel.name}</span>
                            {channel.isPrivate && (
                              <Badge variant="secondary" className="text-xs">
                                プライベート
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Users className="h-3 w-3" />
                            {channel.memberCount}名
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    選択済み: <strong>{selectedChannels.length}</strong> チャンネル
                  </p>
                </div>
              </div>

              <Separator />

              {/* Data Retention Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-4">データ保持設定</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">データ保持期間</label>
                    <Select value={dataRetentionDays} onValueChange={setDataRetentionDays}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7日間</SelectItem>
                        <SelectItem value="30">30日間</SelectItem>
                        <SelectItem value="90">90日間</SelectItem>
                        <SelectItem value="180">180日間</SelectItem>
                        <SelectItem value="365">1年間</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-600 mt-1">過去のメッセージをどの期間まで取得するかを設定します</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">同期頻度</label>
                    <Select defaultValue="daily">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">リアルタイム</SelectItem>
                        <SelectItem value="hourly">1時間ごと</SelectItem>
                        <SelectItem value="daily">1日1回</SelectItem>
                        <SelectItem value="weekly">週1回</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-600 mt-1">新しいメッセージを取得する頻度を設定します</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Save Settings */}
              <div className="flex justify-end gap-3">
                <Button variant="outline">設定をリセット</Button>
                <Button className="bg-purple-600 hover:bg-purple-700" disabled={selectedChannels.length === 0}>
                  設定を保存
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help and Documentation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              ヘルプとドキュメント
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">🔧 トラブルシューティング</h3>
                <p className="text-sm text-gray-600 mb-2">接続に問題がある場合の対処法</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      詳細を見る
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>トラブルシューティング</DialogTitle>
                      <DialogDescription>よくある問題と解決方法をご紹介します</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold">接続エラーが発生する場合</h4>
                        <ul className="text-sm text-gray-600 list-disc list-inside mt-1">
                          <li>ブラウザのポップアップブロックを無効にしてください</li>
                          <li>Slackワークスペースの管理者権限を確認してください</li>
                          <li>ネットワーク接続を確認してください</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold">権限エラーが発生する場合</h4>
                        <ul className="text-sm text-gray-600 list-disc list-inside mt-1">
                          <li>ワークスペース管理者に権限付与を依頼してください</li>
                          <li>必要な権限がすべて許可されているか確認してください</li>
                        </ul>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">📚 データ活用ガイド</h3>
                <p className="text-sm text-gray-600 mb-2">Slackデータを効果的に活用する方法</p>
                <Button variant="outline" size="sm">
                  ガイドを読む
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
