import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LendingRecommendations from "@/components/LendingRecommendations";

const LendingRecommendationsPage = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lending Intelligence</CardTitle>
          <CardDescription>
            AI-powered recommendations to optimize your lending strategy and reduce financial burden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LendingRecommendations />
        </CardContent>
      </Card>
    </div>
  );
};

export default LendingRecommendationsPage;