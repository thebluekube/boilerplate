const DEPLOY_ENVS = [
  { key: 'planner-prod', name: 'Planner - Prod', command: '/opt/scripts/deploy_planner_prod.sh' },
  { key: 'planner-staging', name: 'Planner - Staging', command: '/opt/scripts/deploy_planner_staging.sh' },
  { key: 'planner-test', name: 'Planner - Test', command: '/opt/scripts/deploy_planner_test.sh' },
  { key: 'pact-prod', name: 'Pact - Prod', command: '/opt/scripts/deploy_pact_prod.sh' },
  { key: 'pact-staging', name: 'Pact - Staging', command: '/opt/scripts/deploy_pact_staging.sh' },
  { key: 'pact-test', name: 'Pact - Test', command: '/opt/scripts/deploy_pact_test.sh' },
];
module.exports = { DEPLOY_ENVS }; 