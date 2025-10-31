# Resource Labeling System

This system provides automated labeling for resources using AI, with support for both main category labels and subcategory labels.

## Overview

1. **Initial Labeling** - Assigns main category tags (Search, AI, Crypto, Trading, Utility, Random)
2. **Sub-Tag Validation & Assignment Pipeline** - Generates, validates, assigns, and iterates on subcategory structures with quality metrics

## API Endpoints

### 1. Initial Labeling: `/api/resources/label`

Assigns main category tags to resources that haven't been labeled yet.

**Method:** `GET`

**Query Parameters:**
- `resourceIds` (optional): Comma-separated list of resource IDs to label
  - If not provided, labels all unlabeled resources

**Authentication:** Requires `Authorization: Bearer <CRON_SECRET>` in production

**Example:**
```bash
# Label all unlabeled resources
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  http://localhost:3000/api/resources/label

# Label specific resources
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  "http://localhost:3000/api/resources/label?resourceIds=uuid1,uuid2,uuid3"
```

**Response:**
```json
{
  "success": true,
  "message": "Resource labeling completed",
  "processed": 150,
  "successful": 148,
  "failed": 2,
  "durationMs": 45320,
  "results": [...] // First 100 results
}
```

---

### 2. Sub-Tag Assignment Pipeline: `/api/resources/sub-tag-validation-assignment-pipeline`

Assigns resources to predefined subcategories and provides quality metrics.

Each subcategory has a name and description that helps the AI accurately classify resources.

**Method:** `POST` (also supports `GET` for testing)

**Request Body:**
```json
{
  "mainCategory": "AI",          // Required: Search, AI, Crypto, Trading, Utility, or Random
  "createTags": false            // Whether to create tags in DB
}
```

**Parameters:**
- `mainCategory` - Which main category to analyze
- `createTags`: If true, creates the subcategory tags in the database

**Authentication:** Requires `Authorization: Bearer <CRON_SECRET>` in production

**Example (POST):**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -d '{
    "mainCategory": "AI",
    "createTags": true
  }' \
  http://localhost:3000/api/resources/sub-tag-validation-assignment-pipeline
```

**Example (GET):**
```bash
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  "http://localhost:3000/api/resources/sub-tag-validation-assignment-pipeline?mainCategory=AI&createTags=true"
```

**Response:**
```json
{
  "success": true,
  "message": "Subcategory assignment completed",
  "mainCategory": "AI",
  "sessionId": "uuid",
  "durationMs": 45670,
  "result": {
    "subcategories": [
      "Chat/Conversational AI",
      "Image Generation",
      "Code Assistant",
      "Text Analysis/Processing",
      "Agent/Automation"
    ],
    "qualityScore": 82.5,
    "metrics": {
      "gini": 0.186,                    // 0 = perfect balance, 1 = total inequality
      "ambiguityRate": 12.3,            // % of resources with unclear subcategory
      "avgConfidenceGap": 0.68,         // Average confidence gap between top 2 choices
      "emptyCategories": 0,
      "dominatingCategories": 0,
      "underutilizedCategories": 0
    },
    "distribution": [
      {
        "subcategory": "Chat/Conversational AI",
        "count": 45,
        "percentage": 30.0,
        "isEmpty": false,
        "isDominating": false,
        "isUnderutilized": false
      },
      // ... more subcategories
    ],
    "topConflicts": [
      {
        "pair": ["Chat/Conversational AI", "Agent/Automation"],
        "conflicts": 8
      }
    ]
  },
  "createdTags": [
    { "name": "Chat/Conversational AI", "id": "uuid1" },
    // ... if createTags was true
  ]
}
```

---

## Quality Metrics Explained

### Gini Coefficient (0-1)
- **0** = Perfect balance (all subcategories have equal resources)
- **<0.3** = Good balance ✓
- **0.3-0.5** = Acceptable
- **>0.5** = Poor balance (some subcategories dominate)

### Ambiguity Rate (%)
- Percentage of resources where confidence gap between top 2 subcategories is <0.15
- **<20%** = Good clarity ✓
- **20-40%** = Acceptable
- **>40%** = High overlap between subcategories

### Quality Score (0-100)
- **75+** = Meets quality threshold ✓
- **50-74** = Acceptable but needs improvement
- **<50** = Poor quality, refinement needed

---

## Main Categories and Subcategories

### Search
- Web Search
- Data/Database Search
- Image/Media Search
- Code/Documentation Search
- News/Content Search

### AI
- Chat/Conversational AI
- Image Generation
- Code Assistant
- Text Analysis/Processing
- Agent/Automation

### Crypto
- MEME COINS
- NFT/Collectibles
- DeFi/Staking
- Token Creation/Minting
- Wallet/Portfolio

### Trading
- DEX/Swapping
- Price Tracking
- Trading Bots
- Portfolio Management
- Market Analytics

### Utility
- Code Execution
- Data Storage/Cache
- API/Integration
- Weather/Location
- Conversion/Formatting

### Random
- Jokes/Humor
- Games
- Meme Generation
- Entertainment
- Social/Fun

---

## Workflow Examples

### Complete Labeling Workflow
```bash
# Step 1: Label all resources with main categories
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  http://localhost:3000/api/resources/label

# Step 2: Run the assignment pipeline for each main category
# This will assign resources to subcategories and create tags in the database
for category in Search AI Crypto Trading Utility Random; do
  curl -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${CRON_SECRET}" \
    -d "{\"mainCategory\":\"$category\",\"createTags\":true}" \
    http://localhost:3000/api/resources/sub-tag-validation-assignment-pipeline
done
```

---

## Monitoring & Logging

All endpoints provide comprehensive logging:

```
============================================================
ℹ Starting subcategory assignment for AI
ℹ Subcategories: Chat/Conversational AI, Image Generation, ...

ℹ Assigning resources to subcategories...
▶ [====================] 100% Assigned 150/150 resources
ℹ Assignment complete in 12.3s

📊 Quality Metrics:
  Quality Score: 82.5/100
  Gini: 0.186
  Ambiguity: 12.3%

📈 Distribution Details:
  ✓ Chat/Conversational AI: 45 resources (30.0%)
  ✓ Image Generation: 38 resources (25.3%)
  ...

⚠️ Found 12 ambiguous assignments
Top conflicted pairs:
  - Chat/Conversational AI ↔ Agent/Automation: 8 conflicts

============================================================
ℹ Assignment completed in 15.8s
```

---

## Development

For local development, the CRON_SECRET check is disabled. You can call endpoints directly:

```bash
# Local development (no auth required)
curl http://localhost:3000/api/resources/label
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"mainCategory":"AI"}' \
  http://localhost:3000/api/resources/sub-tag-validation-assignment-pipeline
```

---

## Code Structure

```
scan/src/
├── app/api/resources/
│   ├── label/route.ts                                      # Initial labeling endpoint
│   └── sub-tag-validation-assignment-pipeline/route.ts     # Pipeline for validation, assignment, and iteration
└── services/
    ├── db/resources/
    │   ├── resource.ts                 # Resource queries
    │   └── tag.ts                      # Tag operations
    └── labeling/
        ├── main-tags.ts                # Main category definitions
        ├── initial-label.ts            # Initial labeling logic
        └── sub-label.ts                # Sub-tag validation & assignment logic
```
