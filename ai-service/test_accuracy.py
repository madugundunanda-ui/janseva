import os
import time
import io
import json
from PIL import Image, ImageDraw
import torch
import numpy as np

# Import the Flask application
from app import app, CIVIC_CATEGORIES

def create_synthetic_image(color, text=None):
    """Create a synthetic image in memory for testing."""
    img = Image.new('RGB', (300, 300), color=color)
    if text:
        draw = ImageDraw.Draw(img)
        draw.text((10, 10), text, fill=(255, 255, 255))
    
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_byte_arr.seek(0)
    return img_byte_arr

def run_accuracy_tests():
    print("=" * 60)
    print("JANSEVA AI CLASSIFIER ACCURACY & PERFORMANCE TEST SUITE")
    print("=" * 60)
    
    client = app.test_client()
    
    # Locate sample garbage images in the backend directory
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    complaints_dir = os.path.join(parent_dir, "backend", "src", "uploads", "complaints")
    
    garbage_images = []
    if os.path.exists(complaints_dir):
        for f in os.listdir(complaints_dir):
            if "Garbage" in f and f.endswith((".jpg", ".png", ".jpeg")):
                path = os.path.join(complaints_dir, f)
                if os.path.getsize(path) > 100:  # verify it's not a placeholder
                    garbage_images.append(path)
                    
    print(f"Found {len(garbage_images)} real garbage/waste images in backend uploads.")
    
    test_cases = []
    
    # 1. Add real civic garbage image test cases
    for i, img_path in enumerate(garbage_images[:5]):
        test_cases.append({
            "name": f"Real Garbage Image #{i+1}",
            "type": "civic_garbage",
            "source": "file",
            "path": img_path,
            "expected_category": ["Garbage / Waste", "Illegal Dumping"]
        })
        
    # 2. Add synthetic non-civic/low-confidence test cases
    test_cases.append({
        "name": "Synthetic Solid Gray (Non-Civic)",
        "type": "non_civic",
        "source": "synthetic",
        "color": "gray",
        "text": "Screenshot of text or plain background",
        "expected_low_confidence": True
    })
    
    test_cases.append({
        "name": "Synthetic Blue Noise (Non-Civic)",
        "type": "non_civic",
        "source": "synthetic",
        "color": "blue",
        "text": "Abstract pattern",
        "expected_low_confidence": True
    })

    print(f"Total test cases configured: {len(test_cases)}")
    print("-" * 60)
    
    results = []
    inference_times = []
    
    for tc in test_cases:
        print(f"Running test: {tc['name']}...")
        
        # Prepare image bytes
        if tc["source"] == "file":
            try:
                with open(tc["path"], "rb") as f:
                    img_bytes = io.BytesIO(f.read())
            except Exception as e:
                print(f"  [ERROR] Failed to read test file {tc['path']}: {e}")
                continue
        else:
            img_bytes = create_synthetic_image(tc["color"], tc.get("text"))
            
        # Call /predict route
        start_time = time.time()
        response = client.post(
            '/predict',
            data={'image': (img_bytes, 'test_image.jpg')},
            content_type='multipart/form-data'
        )
        duration = time.time() - start_time
        inference_times.append(duration)
        
        # Validate response
        assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
        data = json.loads(response.data.decode('utf-8'))
        
        success = data.get("success", False)
        low_confidence = data.get("low_confidence", False)
        predicted_cat = data.get("category", "None")
        confidence = data.get("confidence", 0)
        
        tc_result = {
            "name": tc["name"],
            "type": tc["type"],
            "duration_ms": duration * 1000,
            "success": success,
            "low_confidence": low_confidence,
            "predicted_category": predicted_cat,
            "confidence": confidence,
            "passed": False
        }
        
        if tc["type"] == "civic_garbage":
            # We check if it predicted the correct category or at least successfully classified with confidence
            allowed = tc["expected_category"]
            correct_cat = (predicted_cat in allowed)
            tc_result["passed"] = correct_cat and (not low_confidence)
            print(f"  Result: Predicted='{predicted_cat}', Conf={confidence}%, LowConf={low_confidence}, Time={duration*1000:.1f}ms (Passed: {tc_result['passed']})")
        else:
            # Non-civic image should trigger low confidence rejection
            tc_result["passed"] = low_confidence
            print(f"  Result: Predicted='{predicted_cat}', Conf={confidence}%, LowConf={low_confidence}, Time={duration*1000:.1f}ms (Passed: {tc_result['passed']})")
            
        results.append(tc_result)
        
    print("-" * 60)
    print("METRICS AND STATISTICS:")
    print("-" * 60)
    
    total_runs = len(results)
    passed_runs = sum(1 for r in results if r["passed"])
    accuracy = (passed_runs / total_runs) * 100 if total_runs > 0 else 0
    avg_time_ms = np.mean(inference_times) * 1000 if inference_times else 0
    
    civic_cases = [r for r in results if r["type"] == "civic_garbage"]
    non_civic_cases = [r for r in results if r["type"] == "non_civic"]
    
    civic_passed = sum(1 for r in civic_cases if r["passed"])
    non_civic_passed = sum(1 for r in non_civic_cases if r["passed"])
    
    print(f"Overall Accuracy: {accuracy:.2f}% ({passed_runs}/{total_runs} passed)")
    print(f"Civic Classification (Recall): {civic_passed}/{len(civic_cases) if civic_cases else 1} passed")
    print(f"Non-Civic Rejection Rate (Specificity): {non_civic_passed}/{len(non_civic_cases) if non_civic_cases else 1} passed")
    print(f"Average Inference Time: {avg_time_ms:.2f} ms")
    
    # 3. Test /feedback route
    print("-" * 60)
    print("Testing /feedback endpoint...")
    feedback_payload = {
        "original_prediction": "Tobacco Issue",
        "corrected_category": "Garbage / Waste",
        "image_path": garbage_images[0] if garbage_images else "backend/src/uploads/complaints/1779988572570-871f98fb-f7f7-4e89-905f-557c888ef878.jpg"
    }
    
    fb_response = client.post(
        '/feedback',
        data=json.dumps(feedback_payload),
        content_type='application/json'
    )
    
    assert fb_response.status_code == 200, f"Expected 200, got {fb_response.status_code}"
    fb_data = json.loads(fb_response.data.decode('utf-8'))
    print(f"Feedback endpoint response: {fb_data}")
    
    feedback_file = os.path.join(os.path.dirname(__file__), 'feedback_corrections.json')
    if os.path.exists(feedback_file):
        print(f"Verified: 'feedback_corrections.json' successfully created/updated at {feedback_file}")
    else:
        print("[ERROR] feedback_corrections.json was not created!")
        
    print("=" * 60)
    
if __name__ == "__main__":
    run_accuracy_tests()
