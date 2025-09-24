mod ollama_manager;
mod yolo_detector;

use ollama_manager::{OllamaManager, OllamaStatus};
use yolo_detector::{YoloDetector, DetectionData};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{Manager, State};
use tokio::sync::Mutex;

#[derive(Clone)]
struct AppState {
    ollama: Arc<Mutex<OllamaManager>>,
    yolo: Arc<Mutex<YoloDetector>>,
}

#[derive(Serialize, Deserialize)]
struct AnalyzeRequest {
    image_base64: String,
    prompt: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct AnalyzeResponse {
    description: String,
    error: Option<String>,
}

#[tauri::command]
async fn start_ollama(state: State<'_, AppState>) -> Result<String, String> {
    let mut ollama = state.ollama.lock().await;
    ollama.start().await?;

    // Pull the vision model
    println!("Pulling vision model...");
    ollama.pull_model("llava:7b").await?;

    Ok("Ollama started and model ready".to_string())
}

#[tauri::command]
async fn check_ollama_status(_state: State<'_, AppState>) -> Result<OllamaStatus, String> {
    println!("check_ollama_status called!");

    // Call the static method directly without holding any locks
    let status = OllamaManager::check_status().await;
    println!("Ollama status received: {:?}", status);

    Ok(status)
}

#[tauri::command]
async fn analyze_image(
    _state: State<'_, AppState>,
    request: AnalyzeRequest,
) -> Result<AnalyzeResponse, String> {
    println!("analyze_image called!");
    println!("Image base64 length: {}", request.image_base64.len());
    println!("Prompt: {:?}", request.prompt);

    // Check if Ollama is running
    let status = OllamaManager::check_status().await;
    println!("Ollama status: running={}, model_ready={}", status.running, status.model_ready);

    if !status.running || !status.model_ready {
        println!("Ollama not ready, returning error");
        return Ok(AnalyzeResponse {
            description: String::new(),
            error: Some("Ollama not ready".to_string()),
        });
    }

    // Make request to Ollama API with timeout
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let prompt = request.prompt.unwrap_or_else(||
        "Describe what you see in this image in 2-3 sentences. Focus on the main subjects and activities.".to_string()
    );

    println!("Sending request to Ollama API...");
    let json_payload = serde_json::json!({
        "model": "llava:7b",
        "prompt": prompt,
        "images": [request.image_base64],
        "stream": false
    });

    let response = client
        .post("http://127.0.0.1:11434/api/generate")
        .json(&json_payload)
        .send()
        .await
        .map_err(|e| {
            println!("Failed to send request to Ollama: {}", e);
            format!("Failed to analyze image: {}", e)
        })?;

    println!("Ollama API response status: {}", response.status());

    if !response.status().is_success() {
        let status_text = response.status().to_string();
        let error_text = response.text().await.unwrap_or_default();
        println!("Analysis failed with status {}: {}", status_text, error_text);
        return Ok(AnalyzeResponse {
            description: String::new(),
            error: Some(format!("Analysis failed: {} - {}", status_text, error_text)),
        });
    }

    let response_text = response.text().await
        .map_err(|e| {
            println!("Failed to read response text: {}", e);
            format!("Failed to read response: {}", e)
        })?;

    println!("Response text length: {}", response_text.len());

    let result: serde_json::Value = serde_json::from_str(&response_text)
        .map_err(|e| {
            println!("Failed to parse JSON response: {}", e);
            println!("Response was: {}", response_text);
            format!("Failed to parse response: {}", e)
        })?;

    let description = result["response"]
        .as_str()
        .unwrap_or("No description available")
        .to_string();

    println!("Analysis successful, description length: {}", description.len());

    Ok(AnalyzeResponse {
        description,
        error: None,
    })
}

#[tauri::command]
async fn capture_camera_frame() -> Result<String, String> {
    // This will be handled by the frontend using WebRTC
    // Returning a placeholder for now
    Ok("Camera capture handled by frontend".to_string())
}

// New command for YOLO detection
#[tauri::command]
async fn yolo_detect(
    state: State<'_, AppState>,
    frame_base64: String,
    _model: Option<String>,
) -> Result<DetectionData, String> {
    let detector = state.yolo.lock().await;
    detector.detect(&frame_base64).await
}

// New command for event-triggered LLaVA analysis
#[tauri::command]
async fn analyze_with_llava(
    _state: State<'_, AppState>,
    frame_base64: String,
    prompt: String,
    timeout: Option<u64>,
) -> Result<serde_json::Value, String> {
    println!("analyze_with_llava called with custom prompt");

    // Check if Ollama is running
    let status = OllamaManager::check_status().await;
    if !status.running || !status.model_ready {
        return Err("Ollama not ready".to_string());
    }

    // Set timeout (default 30 seconds to handle LLaVA processing)
    let timeout_duration = std::time::Duration::from_millis(timeout.unwrap_or(30000));

    let client = reqwest::Client::builder()
        .timeout(timeout_duration)
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    // Use the installed llava:7b model with optimized settings
    let json_payload = serde_json::json!({
        "model": "llava:7b",
        "prompt": prompt,
        "images": [frame_base64],
        "stream": false,
        "keep_alive": "5m",  // Keep model loaded for 5 minutes
        "options": {
            "temperature": 0.3,  // Lower temperature for more consistent output
            "num_predict": 200,  // Reduce response length for faster processing
            "num_ctx": 2048,     // Smaller context window for vision tasks
            "num_thread": 4      // Limit threads to prevent overload
        }
    });

    let response = client
        .post("http://127.0.0.1:11434/api/generate")
        .json(&json_payload)
        .send()
        .await
        .map_err(|e| format!("Failed to analyze: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Analysis failed: {}", response.status()));
    }

    let result: serde_json::Value = response.json().await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    // Try to parse the LLaVA response as JSON if possible
    if let Some(response_text) = result["response"].as_str() {
        // Try to parse as JSON first
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(response_text) {
            return Ok(json);
        }
    }

    Ok(result)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let ollama_manager = OllamaManager::new(&app.handle());
            let mut yolo_detector = YoloDetector::new();

            // Initialize YOLO detector
            tauri::async_runtime::block_on(async {
                if let Err(e) = yolo_detector.initialize().await {
                    eprintln!("Failed to initialize YOLO: {}", e);
                }
            });

            let app_state = AppState {
                ollama: Arc::new(Mutex::new(ollama_manager)),
                yolo: Arc::new(Mutex::new(yolo_detector)),
            };

            app.manage(app_state);

            // Start Ollama in background
            let state = app.state::<AppState>();
            let state_clone = state.inner().clone();

            tauri::async_runtime::spawn(async move {
                println!("Starting embedded Ollama...");
                if let Err(e) = state_clone.ollama.lock().await.start().await {
                    eprintln!("Failed to start Ollama: {}", e);
                } else {
                    println!("Ollama started successfully");
                    // Pull the standard llava model
                    if let Err(e) = state_clone.ollama.lock().await.pull_model("llava:7b").await {
                        eprintln!("Failed to pull model: {}", e);
                    } else {
                        println!("Model pulled successfully, preloading...");

                        // Preload the model to avoid cold starts
                        let client = reqwest::Client::new();
                        let preload_payload = serde_json::json!({
                            "model": "llava:7b",
                            "keep_alive": "10m"  // Keep loaded for 10 minutes
                        });

                        if let Err(e) = client
                            .post("http://127.0.0.1:11434/api/generate")
                            .json(&preload_payload)
                            .send()
                            .await
                        {
                            eprintln!("Failed to preload model: {}", e);
                        } else {
                            println!("LLaVA model preloaded and ready!");
                        }
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            start_ollama,
            check_ollama_status,
            analyze_image,
            capture_camera_frame,
            yolo_detect,
            analyze_with_llava
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}