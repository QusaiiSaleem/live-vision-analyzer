use std::path::PathBuf;
use std::process::{Child, Command};
use std::fs;
use std::io::Write;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaStatus {
    pub running: bool,
    pub model_ready: bool,
    pub error: Option<String>,
}

pub struct OllamaManager {
    process: Option<Child>,
    data_dir: PathBuf,
}

impl OllamaManager {
    pub fn new(_app_handle: &AppHandle) -> Self {
        // For now, use a fixed path in the user's home directory
        let home_dir = std::env::var("HOME").unwrap_or_else(|_| "/tmp".to_string());
        let data_dir = PathBuf::from(home_dir).join(".live-vision-analyzer").join("ollama");

        fs::create_dir_all(&data_dir).ok();

        Self {
            process: None,
            data_dir,
        }
    }

    pub async fn download_ollama(&self) -> Result<PathBuf, String> {
        let ollama_dir = self.data_dir.join("bin");
        fs::create_dir_all(&ollama_dir).map_err(|e| e.to_string())?;

        let ollama_path = ollama_dir.join(if cfg!(windows) {
            "ollama.exe"
        } else {
            "ollama"
        });

        if ollama_path.exists() {
            return Ok(ollama_path);
        }

        // Download Ollama binary based on platform
        let download_url = if cfg!(target_os = "macos") {
            if cfg!(target_arch = "aarch64") {
                "https://github.com/ollama/ollama/releases/download/v0.4.7/ollama-darwin"
            } else {
                "https://github.com/ollama/ollama/releases/download/v0.4.7/ollama-darwin"
            }
        } else if cfg!(target_os = "windows") {
            "https://github.com/ollama/ollama/releases/download/v0.4.7/ollama-windows-amd64.exe"
        } else {
            "https://github.com/ollama/ollama/releases/download/v0.4.7/ollama-linux-amd64"
        };

        println!("Downloading Ollama from: {}", download_url);

        let response = reqwest::get(download_url)
            .await
            .map_err(|e| format!("Failed to download Ollama: {}", e))?;

        let bytes = response
            .bytes()
            .await
            .map_err(|e| format!("Failed to read download: {}", e))?;

        let mut file = fs::File::create(&ollama_path)
            .map_err(|e| format!("Failed to create file: {}", e))?;

        file.write_all(&bytes)
            .map_err(|e| format!("Failed to write file: {}", e))?;

        // Make executable on Unix
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mut perms = fs::metadata(&ollama_path)
                .map_err(|e| e.to_string())?
                .permissions();
            perms.set_mode(0o755);
            fs::set_permissions(&ollama_path, perms)
                .map_err(|e| e.to_string())?;
        }

        Ok(ollama_path)
    }

    pub async fn start(&mut self) -> Result<(), String> {
        if self.process.is_some() {
            return Ok(());
        }

        // First check if Ollama is already running
        let client = reqwest::Client::new();
        match client.get("http://127.0.0.1:11434/api/version").send().await {
            Ok(response) if response.status().is_success() => {
                println!("Ollama already running on system, using existing instance");
                // Don't start a new instance, just return success
                return Ok(());
            }
            _ => {
                // Ollama not running, start embedded instance
                println!("Starting embedded Ollama...");
            }
        }

        let ollama_path = self.download_ollama().await?;

        // Set environment variables
        let models_dir = self.data_dir.join("models");
        fs::create_dir_all(&models_dir).map_err(|e| e.to_string())?;

        // Start Ollama server
        let mut cmd = Command::new(ollama_path);
        cmd.env("OLLAMA_MODELS", models_dir)
            .env("OLLAMA_HOST", "127.0.0.1:11434")
            .arg("serve");

        let child = cmd.spawn()
            .map_err(|e| format!("Failed to start Ollama: {}", e))?;

        self.process = Some(child);

        // Wait for server to be ready
        tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;

        Ok(())
    }

    pub async fn pull_model(&self, model_name: &str) -> Result<(), String> {
        // Check if model already exists
        let models_dir = self.data_dir.join("models");
        let model_manifest = models_dir.join("manifests")
            .join("registry.ollama.ai")
            .join("library")
            .join(model_name);

        if model_manifest.exists() {
            println!("Model {} already exists", model_name);
            return Ok(());
        }

        // Pull model using API
        let client = reqwest::Client::new();
        let response = client
            .post("http://127.0.0.1:11434/api/pull")
            .json(&serde_json::json!({
                "name": model_name,
                "stream": false
            }))
            .send()
            .await
            .map_err(|e| format!("Failed to pull model: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to pull model: {}", response.status()));
        }

        Ok(())
    }

    pub async fn check_status() -> OllamaStatus {
        println!("OllamaManager: Checking status...");
        // Check if server is responding (either our process or system Ollama)
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(2))
            .build()
            .unwrap();

        println!("OllamaManager: Making request to Ollama API...");
        match client.get("http://127.0.0.1:11434/api/tags").send().await {
            Ok(response) if response.status().is_success() => {
                // Check if vision model is available
                let body = response.text().await.unwrap_or_default();
                println!("Ollama API response: {}", &body[..body.len().min(200)]);

                // More specific check for llava:7b model
                let model_ready = body.contains("llava:7b") ||
                                  body.contains("llava:") ||
                                  body.contains("llama3.2-vision");

                println!("Model ready status: {}", model_ready);

                OllamaStatus {
                    running: true,
                    model_ready,
                    error: None,
                }
            }
            Err(e) => {
                println!("OllamaManager: Request failed: {}", e);
                // Server not responding
                OllamaStatus {
                    running: false,
                    model_ready: false,
                    error: Some(format!("Ollama server not responding: {}", e)),
                }
            }
            Ok(response) => {
                println!("OllamaManager: Unexpected response status: {}", response.status());
                OllamaStatus {
                    running: false,
                    model_ready: false,
                    error: Some(format!("Ollama server returned: {}", response.status())),
                }
            }
        }
    }

    pub fn stop(&mut self) {
        if let Some(mut child) = self.process.take() {
            child.kill().ok();
        }
    }
}

impl Drop for OllamaManager {
    fn drop(&mut self) {
        self.stop();
    }
}