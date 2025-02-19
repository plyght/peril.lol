use iced::{
    button, text_input, Alignment, Application, Button, Column, Command, Element, Length,
    Settings, Subscription, Text, TextInput,
};
use std::path::PathBuf;
use std::process::Command as SysCommand;
use std::sync::{Arc, Mutex};

use copypasta::{ClipboardContext, ClipboardProvider};
use fuzzy_matcher::skim::SkimMatcherV2;
use fuzzy_matcher::FuzzyMatcher;

#[derive(Debug)]
struct RustyMacLauncher {
    // UI state
    query: String,
    search_results: Vec<String>,
    clipboard_entries: Vec<String>,
    // Buttons
    clear_clipboard_button: button::State,
    // For text input
    query_input_state: text_input::State,
    // Shared data
    data: Arc<Mutex<LauncherData>>,
}

#[derive(Debug)]
struct LauncherData {
    installed_apps: Vec<String>,
    // Keep track of the last seen clipboard text
    last_clipboard: String,
}

#[derive(Debug, Clone)]
enum Message {
    QueryChanged(String),
    SearchUpdated,
    AppsFound(Vec<String>),
    ClipboardUpdated(String),
    ClearClipboard,
    LaunchApp(String),
    None,
}

impl Application for RustyMacLauncher {
    type Executor = iced::executor::Default;
    type Message = Message;
    type Flags = Arc<Mutex<LauncherData>>;

    fn new(data: Self::Flags) -> (Self, Command<Self::Message>) {
        // On launch, load pre-existing data (installed apps, etc.)
        let launcher_data = data.lock().unwrap();
        (
            RustyMacLauncher {
                query: String::new(),
                search_results: launcher_data.installed_apps.clone(),
                clipboard_entries: vec![],
                clear_clipboard_button: button::State::new(),
                query_input_state: text_input::State::new(),
                data,
            },
            Command::none(),
        )
    }

    fn title(&self) -> String {
        "Rusty Mac Launcher".into()
    }

    fn update(&mut self, message: Message) -> Command<Message> {
        match message {
            Message::QueryChanged(new_query) => {
                self.query = new_query;
                Command::perform(async {}, |_| Message::SearchUpdated)
            }
            Message::SearchUpdated => {
                let data = self.data.lock().unwrap();
                let matcher = SkimMatcherV2::default();
                let mut scored: Vec<(i64, &String)> = data
                    .installed_apps
                    .iter()
                    .filter_map(|app| {
                        matcher.fuzzy_match(app, &self.query).map(|score| (score, app))
                    })
                    .collect();
                scored.sort_by_key(|(score, _)| -score); // highest first
                self.search_results = scored.iter().map(|(_, app)| (*app).clone()).collect();
                Command::none()
            }
            Message::AppsFound(apps) => {
                // This might be triggered by a background thread searching for apps.
                let mut data = self.data.lock().unwrap();
                data.installed_apps = apps;
                self.search_results = data.installed_apps.clone();
                Command::none()
            }
            Message::ClipboardUpdated(new_clip) => {
                // Update local list of clipboard entries
                if !new_clip.is_empty() && !self.clipboard_entries.contains(&new_clip) {
                    self.clipboard_entries.insert(0, new_clip);
                    if self.clipboard_entries.len() > 20 {
                        self.clipboard_entries.pop();
                    }
                }
                Command::none()
            }
            Message::ClearClipboard => {
                self.clipboard_entries.clear();
                Command::none()
            }
            Message::LaunchApp(app_path) => {
                // Launch app via `open` command
                let _ = SysCommand::new("open").arg(app_path).spawn();
                Command::none()
            }
            Message::None => Command::none(),
        }
    }

    fn subscription(&self) -> Subscription<Message> {
        // We'll combine two subscription streams:
        // 1) Periodically rescanning for new .app bundles (or we do it once at startup)
        // 2) Periodically checking the clipboard for changes
        iced::Subscription::batch(vec![
            // Poll the clipboard
            iced::time::every(std::time::Duration::from_millis(500))
                .map(|_| {
                    // We'll attempt to read the clipboard
                    let mut ctx = ClipboardContext::new().ok()?;
                    let current_clip = ctx.get_contents().ok()?;
                    Some(Message::ClipboardUpdated(current_clip))
                })
                .map(|maybe_msg| maybe_msg.unwrap_or(Message::None)),
        ])
    }

    fn view(&mut self) -> Element<Message> {
        // Build the UI
        let query_input = TextInput::new(
            &mut self.query_input_state,
            "Search apps...",
            &self.query,
            Message::QueryChanged,
        )
        .padding(5)
        .width(Length::Fill);

        let mut results_col = Column::new().spacing(5);
        for app in &self.search_results {
            let text = Text::new(app.clone()).size(16);
            // For each result, we can make the text clickable or use a button
            let btn = Button::new(button::State::new(), text)
                .on_press(Message::LaunchApp(app.clone()));
            results_col = results_col.push(btn);
        }

        let mut clipboard_col = Column::new().spacing(5);
        clipboard_col = clipboard_col.push(Text::new("Clipboard History:").size(18));
        for entry in &self.clipboard_entries {
            clipboard_col =
                clipboard_col.push(Text::new(entry.clone()).size(14));
        }

        let clear_button = Button::new(
            &mut self.clear_clipboard_button,
            Text::new("Clear Clipboard History"),
        )
        .on_press(Message::ClearClipboard);

        let content = Column::new()
            .spacing(20)
            .padding(10)
            .push(query_input)
            .push(results_col)
            .push(clipboard_col)
            .push(clear_button)
            .align_items(Alignment::Start);

        content.into()
    }
}

#[tokio::main]
async fn main() {
    // 1) Scan for apps in a background task
    let installed_apps = find_installed_apps();

    // 2) Initialize shared data
    let data = Arc::new(Mutex::new(LauncherData {
        installed_apps,
        last_clipboard: String::new(),
    }));

    // 3) Launch the Iced application
    //    For a “launcher” style, set minimal window, no decorations, etc.
    let _ = RustyMacLauncher::run(Settings {
        flags: data,
        window: iced::window::Settings {
            size: (600, 400),
            ..iced::window::Settings::default()
        },
        ..Settings::default()
    });
}

/// Scans /Applications and ~/Applications for .app bundles.
/// Returns a Vec of file paths as strings.
fn find_installed_apps() -> Vec<String> {
    let mut results = Vec::new();
    let system_apps = std::path::Path::new("/Applications");
    let user_apps = dirs::home_dir()
        .map(|mut home| {
            home.push("Applications");
            home
        })
        .unwrap_or_else(|| "/Applications".into());

    for folder in &[system_apps, user_apps.as_path()] {
        if folder.is_dir() {
            if let Ok(entries) = std::fs::read_dir(folder) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.extension().map(|s| s == "app").unwrap_or(false) {
                        // Convert to string for fuzzy matching & display
                        if let Some(path_str) = path.to_str() {
                            results.push(path_str.to_string());
                        }
                    }
                }
            }
        }
    }
    results
}