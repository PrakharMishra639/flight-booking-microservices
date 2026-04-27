#!/usr/bin/env node

/**
 * Cost Estimator Module
 * Estimates the cost of running Docker Compose vs Kubernetes scaling.
 */

const AWS_FARGATE_VCPU_HOUR = 0.04048;
const AWS_FARGATE_GB_HOUR = 0.004445;

// Assume average usage stats derived from performance reports
const numServices = 9;

const DOCKER_STATIC_ESTIMATE = {
  vCPUs_per_service: 0.5,
  GBs_per_service: 1,
  services: numServices,
  replicas: 1, // static 1 replica each
  hours_per_month: 730
};

const KUBERNETES_DYNAMIC_ESTIMATE = {
  vCPUs_per_service: 0.5,
  GBs_per_service: 1,
  services: numServices,
  min_replicas: 2,
  max_replicas: 10,
  average_replicas_over_month: 2.5, // HPA scales down when load is low
  hours_per_month: 730
};

function calculateCost(estimate, replicas) {
  const cpuCost = estimate.vCPUs_per_service * replicas * estimate.services * AWS_FARGATE_VCPU_HOUR * estimate.hours_per_month;
  const memCost = estimate.GBs_per_service * replicas * estimate.services * AWS_FARGATE_GB_HOUR * estimate.hours_per_month;
  return Number((cpuCost + memCost).toFixed(2));
}

const dockerCost = calculateCost(DOCKER_STATIC_ESTIMATE, DOCKER_STATIC_ESTIMATE.replicas);
// Note: While Docker uses 1 replica statically, wait, if we manually scale Docker to handle peak load, it needs 5 replicas 24/7.
// A fairer comparison: static over-provisioning vs dynamic scaling
const OVERPROVISIONED_DOCKER_REPLICAS = 5;
const overprovisionedDockerCost = calculateCost(DOCKER_STATIC_ESTIMATE, OVERPROVISIONED_DOCKER_REPLICAS);

const k8sCost = calculateCost(KUBERNETES_DYNAMIC_ESTIMATE, KUBERNETES_DYNAMIC_ESTIMATE.average_replicas_over_month);

console.log("=========================================");
console.log("         COST ESTIMATION MODULE          ");
console.log("=========================================");
console.log(`Cloud Provider Assumptions: AWS Fargate`);
console.log(`Hours/Month: ${DOCKER_STATIC_ESTIMATE.hours_per_month}`);
console.log();
console.log(`1. Static Deployment Cost (Overprovisioned for Peak Load - 5 Replicas)`);
console.log(`   Estimated Monthly Cost: $${overprovisionedDockerCost}`);
console.log();
console.log(`2. Kubernetes HPA Cost (Dynamic Scaling - Avg 2.5 Replicas)`);
console.log(`   Estimated Monthly Cost: $${k8sCost}`);
console.log();
console.log("=========================================");
const savings = (overprovisionedDockerCost - k8sCost).toFixed(2);
const efficiencyGain = (((overprovisionedDockerCost - k8sCost) / overprovisionedDockerCost) * 100).toFixed(1);
console.log(`✅ Efficiency Gain: ${efficiencyGain}%`);
console.log(`✅ Monthly Savings: $${savings}`);
console.log("=========================================");
