'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  Users,
  CreditCard,
  Settings,
  Activity,
  UserPlus,
  Mail,
  Edit,
  Trash2,
  Search,
  Building,
  DollarSign,
  ChevronRight,
  Shield,
  BarChart3
} from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  status: string
  tokensUsed: number
  tokensLimit: number
  joinedAt: string
}

interface TeamSubscription {
  tier: string
  status: string
  totalSeats: number
  usedSeats: number
  monthlyPrice: number
  nextBillingDate: string
  totalTokens: number
  usedTokens: number
}

interface TeamAnalytics {
  totalDocuments: number
  activeUsers: number
  tokensUsedThisMonth: number
  averageUsagePerUser: number
}

export function AccountManagementClient() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [subscription, setSubscription] = useState<TeamSubscription | null>(null)
  const [analytics, setAnalytics] = useState<TeamAnalytics | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')

  // Mock data for development
  const mockTeamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'Ahmed Al-Rashid',
      email: 'ahmed@company.sa',
      role: 'account_manager',
      status: 'active',
      tokensUsed: 45000,
      tokensLimit: 100000,
      joinedAt: '2024-12-01'
    },
    {
      id: '2',
      name: 'Sara Abdullah',
      email: 'sara@company.sa',
      role: 'member',
      status: 'active',
      tokensUsed: 25000,
      tokensLimit: 50000,
      joinedAt: '2024-12-15'
    },
    {
      id: '3',
      name: 'Mohammed Hassan',
      email: 'mohammed@company.sa',
      role: 'member',
      status: 'active',
      tokensUsed: 35000,
      tokensLimit: 50000,
      joinedAt: '2025-01-05'
    },
    {
      id: '4',
      name: 'Fatima Al-Zahra',
      email: 'fatima@company.sa',
      role: 'member',
      status: 'suspended',
      tokensUsed: 15000,
      tokensLimit: 50000,
      joinedAt: '2025-01-10'
    }
  ]

  const mockSubscription: TeamSubscription = {
    tier: 'BUSINESS',
    status: 'active',
    totalSeats: 10,
    usedSeats: 4,
    monthlyPrice: 168.00,
    nextBillingDate: '2025-02-28',
    totalTokens: 200000,
    usedTokens: 120000
  }

  const mockAnalytics: TeamAnalytics = {
    totalDocuments: 256,
    activeUsers: 3,
    tokensUsedThisMonth: 120000,
    averageUsagePerUser: 30000
  }

  useEffect(() => {
    fetchTeamData()
  }, [])

  const fetchTeamData = async () => {
    try {
      setLoading(true)
      // In production, fetch from API
      // const response = await fetch('/api/account/team')
      // const data = await response.json()
      
      // Mock data for now
      setTeamMembers(mockTeamMembers)
      setSubscription(mockSubscription)
      setAnalytics(mockAnalytics)
    } catch (error) {
      console.error('Error fetching team data:', error)
      toast({
        title: "Error",
        description: "Failed to load team data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInviteMember = async () => {
    try {
      // API call to invite member
      toast({
        title: "Success",
        description: `Invitation sent to ${inviteEmail}`,
      })
      setShowInviteModal(false)
      setInviteEmail('')
      setInviteRole('member')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive"
      })
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return
    
    try {
      // API call to remove member
      toast({
        title: "Success",
        description: "Member removed successfully",
      })
      fetchTeamData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive"
      })
    }
  }

  const handleSuspendMember = async (memberId: string, currentStatus: string) => {
    const action = currentStatus === 'suspended' ? 'activate' : 'suspend'
    
    try {
      // API call to suspend/activate member
      toast({
        title: "Success",
        description: `Member ${action}d successfully`,
      })
      fetchTeamData()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} member`,
        variant: "destructive"
      })
    }
  }

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Account Management</h1>
        <p className="text-gray-400">Manage your team and subscription</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 bg-background border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <Badge variant="outline" className="text-green-600 border-green-600">
              {subscription?.usedSeats}/{subscription?.totalSeats} Seats
            </Badge>
          </div>
          <div className="text-2xl font-bold text-white">{teamMembers.length}</div>
          <p className="text-sm text-gray-400">Team Members</p>
        </Card>

        <Card className="p-6 bg-background border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <Badge variant="outline" className={`text-${subscription?.tier === 'BUSINESS' ? 'green' : 'purple'}-600 border-${subscription?.tier === 'BUSINESS' ? 'green' : 'purple'}-600`}>
              {subscription?.tier}
            </Badge>
          </div>
          <div className="text-2xl font-bold text-white">${subscription?.monthlyPrice}/mo</div>
          <p className="text-sm text-gray-400">Monthly Cost</p>
        </Card>

        <Card className="p-6 bg-background border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Activity className="h-5 w-5 text-purple-500" />
            </div>
            <span className="text-sm text-gray-400">
              {((subscription?.usedTokens || 0) / (subscription?.totalTokens || 1) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="text-2xl font-bold text-white">
            {(subscription?.usedTokens || 0).toLocaleString()}
          </div>
          <p className="text-sm text-gray-400">Tokens Used</p>
        </Card>

        <Card className="p-6 bg-background border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <BarChart3 className="h-5 w-5 text-yellow-500" />
            </div>
            <span className="text-sm text-gray-400">This month</span>
          </div>
          <div className="text-2xl font-bold text-white">{analytics?.totalDocuments}</div>
          <p className="text-sm text-gray-400">Documents Created</p>
        </Card>
      </div>

      {/* Subscription Details */}
      <Card className="p-6 bg-background border-border mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Subscription Details</h2>
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <span className="text-gray-400">Plan:</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  {subscription?.tier} - {subscription?.status}
                </Badge>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-400">Next billing:</span>
                <span className="text-white">{subscription?.nextBillingDate}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-400">Token usage:</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${((subscription?.usedTokens || 0) / (subscription?.totalTokens || 1) * 100)}%` }}
                    />
                  </div>
                  <span className="text-white text-sm">
                    {subscription?.usedTokens?.toLocaleString()} / {subscription?.totalTokens?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <Button 
            variant="outline"
            onClick={() => router.push('/en/admin/subscriptions')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Subscription
          </Button>
        </div>
      </Card>

      {/* Team Members */}
      <Card className="p-6 bg-background border-border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Team Members</h2>
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button onClick={() => setShowInviteModal(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Member</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Role</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Token Usage</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Joined</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.id} className={`border-b border-gray-700 hover:bg-gray-800 ${member.status === 'suspended' ? 'bg-red-900/10' : ''}`}>
                  <td className="py-3 px-4">
                    <div>
                      <div className="text-white font-medium">{member.name}</div>
                      <div className="text-sm text-gray-400">{member.email}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className={
                      member.role === 'account_manager' 
                        ? 'text-purple-600 border-purple-600' 
                        : 'text-blue-600 border-blue-600'
                    }>
                      {member.role === 'account_manager' ? 'Account Manager' : 'Member'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className={
                      member.status === 'active' 
                        ? 'text-green-600 border-green-600' 
                        : 'text-red-600 border-red-600'
                    }>
                      {member.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">
                          {member.tokensUsed.toLocaleString()} / {member.tokensLimit.toLocaleString()}
                        </span>
                        <span className="text-gray-400">
                          {Math.round((member.tokensUsed / member.tokensLimit) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            (member.tokensUsed / member.tokensLimit) > 0.9 ? 'bg-red-500' :
                            (member.tokensUsed / member.tokensLimit) > 0.7 ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((member.tokensUsed / member.tokensLimit) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-400">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleSuspendMember(member.id, member.status)}
                        title={member.status === 'suspended' ? 'Activate' : 'Suspend'}
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        title="Send email"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        title="Remove member"
                        className="text-red-500 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">No team members found</p>
          </div>
        )}
      </Card>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-background border-border">
            <h2 className="text-xl font-semibold text-white mb-4">Invite Team Member</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Email Address</label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="member@company.com"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-background"
                >
                  <option value="member">Member</option>
                  <option value="account_manager">Account Manager</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInviteMember}>
                  Send Invitation
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}