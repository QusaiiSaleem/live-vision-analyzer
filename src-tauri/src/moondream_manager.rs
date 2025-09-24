// Moondream 3 MoE Vision Model Integration
// Phase 1: Cloud API Proof of Concept

use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};
use reqwest::Client;

#[derive(Clone)]
pub struct MoondreamManager {
    client: Client,
    api_key: String,
    base_url: String,
}

#[derive(Serialize)]
struct MoondreamRequest {
    image_url: String,
    question: String,
    stream: bool,
}

#[derive(Serialize)]
struct MoondreamDetectRequest {
    image_url: String,
    object: String,
    stream: bool,
}

#[derive(Serialize)]
struct MoondreamPointRequest {
    image_url: String,
    object: String,
    stream: bool,
}

#[derive(Serialize)]
struct MoondreamCaptionRequest {
    image_url: String,
    length: String,
    stream: bool,
}

#[derive(Deserialize, Clone)]
pub struct MoondreamResponse {
    pub answer: Option<String>,
    pub caption: Option<String>,
    pub objects: Option<Vec<ObjectDetection>>,
    pub points: Option<Vec<Point>>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ObjectDetection {
    pub label: String,
    pub confidence: f64,
    pub bbox: BoundingBox,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BoundingBox {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

#[derive(Serialize, Deserialize)]
pub struct AnalysisResult {
    pub provider: String,
    pub response: String,
    pub structured_data: Option<serde_json::Value>,
    pub processing_time_ms: u64,
    pub confidence: Option<f64>,
    pub error: Option<String>,
}

impl MoondreamManager {
    pub fn new(api_key: String) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .user_agent("live-vision-analyzer/1.0")
            .build()
            .expect("Failed to create HTTP client");

        Self {
            client,
            api_key,
            base_url: "https://api.moondream.ai/v1".to_string(),
        }
    }

    /// Analyze image with custom question using Moondream 3
    pub async fn query(&self, image_base64: String, question: String) -> Result<AnalysisResult, String> {
        let start_time = Instant::now();

        let request = MoondreamRequest {
            image_url: format!("data:image/jpeg;base64,{}", image_base64),
            question,
            stream: false,
        };

        println!("🌙 Moondream: Sending query request...");

        let response = self
            .client
            .post(&format!("{}/query", self.base_url))
            .header("X-Moondream-Auth", &self.api_key)
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("Moondream request failed: {}", e))?;

        let processing_time = start_time.elapsed().as_millis() as u64;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            return Ok(AnalysisResult {
                provider: "moondream".to_string(),
                response: String::new(),
                structured_data: None,
                processing_time_ms: processing_time,
                confidence: None,
                error: Some(format!("API error {}: {}", status, error_text)),
            });
        }

        let result: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse Moondream response: {}", e))?;

        let answer = result["answer"]
            .as_str()
            .unwrap_or("")
            .to_string();

        // Try to parse structured data from the response
        let structured_data = self.try_parse_structured(&answer);
        let confidence = result["confidence"].as_f64();

        println!("🌙 Moondream: Analysis completed in {}ms", processing_time);

        Ok(AnalysisResult {
            provider: "moondream".to_string(),
            response: answer,
            structured_data,
            processing_time_ms: processing_time,
            confidence,
            error: None,
        })
    }

    /// Generate image caption
    pub async fn caption(&self, image_base64: String, length: Option<String>) -> Result<AnalysisResult, String> {
        let start_time = Instant::now();

        let request = MoondreamCaptionRequest {
            image_url: format!("data:image/jpeg;base64,{}", image_base64),
            length: length.unwrap_or("normal".to_string()),
            stream: false,
        };

        println!("🌙 Moondream: Generating caption...");

        let response = self
            .client
            .post(&format!("{}/caption", self.base_url))
            .header("X-Moondream-Auth", &self.api_key)
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("Moondream caption request failed: {}", e))?;

        let processing_time = start_time.elapsed().as_millis() as u64;

        if !response.status().is_success() {
            return Ok(AnalysisResult {
                provider: "moondream".to_string(),
                response: String::new(),
                structured_data: None,
                processing_time_ms: processing_time,
                confidence: None,
                error: Some(format!("Caption API error: {}", response.status())),
            });
        }

        let result: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse caption response: {}", e))?;

        let caption = result["caption"]
            .as_str()
            .unwrap_or("")
            .to_string();

        println!("🌙 Moondream: Caption generated in {}ms", processing_time);

        Ok(AnalysisResult {
            provider: "moondream".to_string(),
            response: caption,
            structured_data: None,
            processing_time_ms: processing_time,
            confidence: None,
            error: None,
        })
    }

    /// Detect objects in image
    pub async fn detect(&self, image_base64: String, object: String) -> Result<AnalysisResult, String> {
        let start_time = Instant::now();

        let request = MoondreamDetectRequest {
            image_url: format!("data:image/jpeg;base64,{}", image_base64),
            object,
            stream: false,
        };

        println!("🌙 Moondream: Detecting objects...");

        let response = self
            .client
            .post(&format!("{}/detect", self.base_url))
            .header("X-Moondream-Auth", &self.api_key)
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("Moondream detect request failed: {}", e))?;

        let processing_time = start_time.elapsed().as_millis() as u64;

        if !response.status().is_success() {
            return Ok(AnalysisResult {
                provider: "moondream".to_string(),
                response: String::new(),
                structured_data: None,
                processing_time_ms: processing_time,
                confidence: None,
                error: Some(format!("Detect API error: {}", response.status())),
            });
        }

        let result: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse detect response: {}", e))?;

        let objects_data = result["objects"].clone();
        let objects_description = format!("Detected objects: {:?}", objects_data);

        println!("🌙 Moondream: Object detection completed in {}ms", processing_time);

        Ok(AnalysisResult {
            provider: "moondream".to_string(),
            response: objects_description,
            structured_data: Some(serde_json::json!({ "objects": objects_data })),
            processing_time_ms: processing_time,
            confidence: None,
            error: None,
        })
    }

    /// Get precise coordinates for objects
    pub async fn point(&self, image_base64: String, object: String) -> Result<AnalysisResult, String> {
        let start_time = Instant::now();

        let request = MoondreamPointRequest {
            image_url: format!("data:image/jpeg;base64,{}", image_base64),
            object,
            stream: false,
        };

        println!("🌙 Moondream: Finding object coordinates...");

        let response = self
            .client
            .post(&format!("{}/point", self.base_url))
            .header("X-Moondream-Auth", &self.api_key)
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("Moondream point request failed: {}", e))?;

        let processing_time = start_time.elapsed().as_millis() as u64;

        if !response.status().is_success() {
            return Ok(AnalysisResult {
                provider: "moondream".to_string(),
                response: String::new(),
                structured_data: None,
                processing_time_ms: processing_time,
                confidence: None,
                error: Some(format!("Point API error: {}", response.status())),
            });
        }

        let result: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse point response: {}", e))?;

        let points_data = result.clone();
        let points_description = format!("Object coordinates: {:?}", points_data);

        println!("🌙 Moondream: Object pointing completed in {}ms", processing_time);

        Ok(AnalysisResult {
            provider: "moondream".to_string(),
            response: points_description,
            structured_data: Some(points_data),
            processing_time_ms: processing_time,
            confidence: None,
            error: None,
        })
    }

    /// Advanced structured analysis with custom prompt for retail scenarios
    pub async fn analyze_retail_scene(&self, image_base64: String, scene_type: &str) -> Result<AnalysisResult, String> {
        let prompt = match scene_type {
            "queue" => r#"Analyze this retail scene and return a JSON response with:
{
  "people_count": number,
  "queue_formation": "line|cluster|scattered",
  "estimated_wait_minutes": number,
  "crowd_density": "low|medium|high",
  "customer_mood": ["calm", "impatient", "frustrated"],
  "staff_needed": boolean,
  "description": "natural language description"
}"#,
            "inventory" => r#"Analyze this retail inventory scene and return JSON:
{
  "products_visible": number,
  "shelf_capacity_used": number (0-100),
  "restocking_needed": boolean,
  "empty_spots": number,
  "product_categories": ["category1", "category2"],
  "organization_quality": "poor|good|excellent",
  "description": "natural language description"
}"#,
            "safety" => r#"Analyze this scene for safety concerns and return JSON:
{
  "hazard_detected": boolean,
  "hazard_type": "spill|obstruction|crowd|equipment|none",
  "immediate_action_required": boolean,
  "affected_area": "description of area",
  "severity": "low|medium|high",
  "description": "natural language description"
}"#,
            _ => "Describe this retail scene in detail, focusing on people, objects, activities, and any notable patterns or issues.",
        };

        self.query(image_base64, prompt.to_string()).await
    }

    /// Try to parse structured data from response text
    fn try_parse_structured(&self, text: &str) -> Option<serde_json::Value> {
        // Look for JSON in the response
        if let Some(start) = text.find('{') {
            if let Some(end) = text.rfind('}') {
                if end > start {
                    let json_str = &text[start..=end];
                    if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(json_str) {
                        return Some(parsed);
                    }
                }
            }
        }

        // If no JSON found, create structured data from key information
        None
    }

    /// Check API status and quota
    pub async fn check_status(&self) -> Result<serde_json::Value, String> {
        // This would be a health check endpoint if available
        // For now, just return basic status
        Ok(serde_json::json!({
            "provider": "moondream",
            "status": "ready",
            "base_url": self.base_url,
            "has_api_key": !self.api_key.is_empty()
        }))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_moondream_manager_creation() {
        let manager = MoondreamManager::new("test_key".to_string());
        assert!(!manager.api_key.is_empty());
        assert_eq!(manager.base_url, "https://api.moondream.ai/v1");
    }

    #[test]
    fn test_structured_data_parsing() {
        let manager = MoondreamManager::new("test".to_string());

        let text_with_json = "Here's the analysis: {\"people_count\": 5, \"mood\": \"calm\"}";
        let result = manager.try_parse_structured(text_with_json);
        assert!(result.is_some());

        let text_without_json = "Just a regular description";
        let result = manager.try_parse_structured(text_without_json);
        assert!(result.is_none());
    }
}