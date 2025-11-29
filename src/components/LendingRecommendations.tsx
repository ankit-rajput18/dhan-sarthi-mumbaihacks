import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle, TrendingDown, CreditCard, IndianRupee } from "lucide-react";
import { aiLendingAPI } from "@/lib/api";

interface Recommendation {
  type: string;
  priority: string;
  title: string;
  description: string;
  actions: string[];
}

interface LendingMetric {
  monthlyIncome: number;
  totalMonthlyDebt: number;
  debtToIncomeRatio: number;
  totalLoanBalance: number;
  totalPrincipal: number;
  totalInterestPaid: number;
  loanCount: number;
}

interface UserProfile {
  income: number;
  occupation: string;
  financialGoals: string[];
  riskTolerance: string;
}

const LendingRecommendations = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [metrics, setMetrics] = useState<LendingMetric | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLendingRecommendations();
  }, []);

  const fetchLendingRecommendations = async () => {
    try {
      setLoading(true);
      const response = await aiLendingAPI.getRecommendations();
      setRecommendations(response.recommendations || []);
      setMetrics(response.metrics);
      setUserProfile(response.userProfile);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch lending recommendations');
      console.error('Error fetching lending recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-4 w-4" />;
      case 'medium': return <TrendingDown className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Lending Recommendations</h2>
        <p className="text-muted-foreground">
          AI-powered insights to optimize your lending strategy
        </p>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Debt-to-Income Ratio</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.debtToIncomeRatio.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {metrics.debtToIncomeRatio > 40 ? 'High' : metrics.debtToIncomeRatio > 30 ? 'Moderate' : 'Healthy'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Monthly Debt</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{metrics.totalMonthlyDebt.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                From {metrics.loanCount} loan{metrics.loanCount !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Loan Balance</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{metrics.totalLoanBalance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                ₹{metrics.totalInterestPaid.toLocaleString()} interest paid
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {recommendations.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Personalized Recommendations</h3>
          {recommendations.map((rec, index) => (
            <Card key={index} className={rec.priority === 'high' ? 'border-destructive' : ''}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant={getPriorityColor(rec.priority) as any}>
                    <div className="flex items-center gap-1">
                      {getPriorityIcon(rec.priority)}
                      <span className="capitalize">{rec.priority}</span>
                    </div>
                  </Badge>
                  <CardTitle className="text-lg">{rec.title}</CardTitle>
                </div>
                <CardDescription>{rec.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {rec.actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Great job! We don't have any immediate recommendations for your lending strategy. 
            Continue with your current approach and check back periodically for updates.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button onClick={fetchLendingRecommendations} variant="outline">
          Refresh Recommendations
        </Button>
      </div>
    </div>
  );
};

export default LendingRecommendations;