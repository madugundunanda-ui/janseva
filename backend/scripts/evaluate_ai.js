require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { analyzeComplaintImage } = require('../src/services/aiService');
const logger = require('../src/utils/logger');

// Usage: node evaluate_ai.js [dataset_folder]
const datasetPath = process.argv[2] || path.join(__dirname, '../ai-test-dataset');

const EXPECTED_MAPPINGS = {
  'road': 'Roads & Highways',
  'garbage': 'Sanitation',
  'water': 'Water Supply',
  'electrical': 'Electricity',
};

async function evaluate() {
  if (!fs.existsSync(datasetPath)) {
    console.error(`Dataset folder not found at ${datasetPath}`);
    console.error(`Please create it and add images prefixed with: road_, garbage_, water_, electrical_`);
    process.exit(1);
  }

  const files = fs.readdirSync(datasetPath).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
  if (files.length === 0) {
    console.error('No images found in dataset folder.');
    process.exit(1);
  }

  console.log(`Starting AI Evaluation on ${files.length} images...`);
  
  let totalProcessed = 0;
  let correctDepartment = 0;
  let correctCategory = 0; // Soft match for category
  
  for (const file of files) {
    const filePath = path.join(datasetPath, file);
    const prefix = Object.keys(EXPECTED_MAPPINGS).find(p => file.toLowerCase().startsWith(p));
    
    if (!prefix) {
      console.warn(`Skipping ${file}: Does not match expected prefix (road_, garbage_, water_, electrical_)`);
      continue;
    }

    const expectedDept = EXPECTED_MAPPINGS[prefix];
    
    try {
      // Mock multer file object
      const fileObj = {
        path: filePath,
        filename: file,
        mimetype: 'image/jpeg', // approximation
      };

      const start = Date.now();
      const result = await analyzeComplaintImage(fileObj);
      const end = Date.now();

      const predictedDept = result.department;
      
      const deptMatch = predictedDept === expectedDept;
      if (deptMatch) correctDepartment++;

      // We don't have strict category mappings in this script, but we can check if it's not empty
      if (result.category && result.category.length > 0) correctCategory++;

      totalProcessed++;

      console.log(`[${deptMatch ? 'PASS' : 'FAIL'}] ${file} -> Predicted: ${predictedDept} (Expected: ${expectedDept}) | Conf: ${result.confidence}% | Time: ${end - start}ms`);
    } catch (err) {
      console.error(`[ERROR] ${file} -> Failed to process: ${err.message}`);
      totalProcessed++;
    }
  }

  console.log('\n--- EVALUATION RESULTS ---');
  console.log(`Total Images Evaluated: ${totalProcessed}`);
  console.log(`Department Accuracy: ${((correctDepartment / totalProcessed) * 100).toFixed(2)}%`);
  console.log(`Category Extracted: ${((correctCategory / totalProcessed) * 100).toFixed(2)}%`);
  
  process.exit(0);
}

evaluate();
