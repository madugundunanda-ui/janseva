# AI Service

Flask service for complaint image analysis.

## Setup

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
python app.py
```

## Endpoint

- `POST http://localhost:8000/predict`
  - Form-data: `image` (file)

Response:

```json
{
  "success": true,
  "message": "Prediction generated successfully",
  "data": {
    "problemType": "garbage overflow",
    "department": "Waste Management",
    "title": "Garbage Overflow Near Road",
    "description": "Garbage accumulation detected near the roadside causing a sanitation concern.",
    "confidence": 93,
    "rawLabel": "garbage dump"
  }
}
```
