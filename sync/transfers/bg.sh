bq query --use_legacy_sql=false --location=US --project_id=$(gcloud config get-value project) 'SELECT COUNT(*) AS n FROM `bigquery-public-data.crypto_solana_mainnet_us.Transactions` LIMIT 1;'
