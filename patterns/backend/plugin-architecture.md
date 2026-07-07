## Plugin Architecture in Rust

### Intent

Design extensible systems where third-party or internal code can register new functionality without modifying core code — enabling feature toggles, user-installable extensions, and modular crate organization.

### Problem

Monolithic backends are hard to maintain, test, and extend. Without a plugin system:

- Adding a new feature requires modifying core modules
- Feature flags proliferate as `#[cfg(feature = "...")]` throughout the codebase
- Third-party code can't be loaded dynamically
- The core crate accumulates unnecessary dependencies

### Approach

#### 1. Trait-based plugin system

Define a trait that all plugins implement. Each plugin is a separate crate.

```rust
// core/plugin.rs
#[async_trait]
pub trait Plugin: Send + Sync {
    fn name(&self) -> &'static str;
    fn version(&self) -> &'static str;

    /// Called once when the plugin is registered
    async fn init(&self, ctx: &PluginContext) -> Result<(), PluginError>;

    /// Called before the app shuts down
    async fn shutdown(&self, ctx: &PluginContext) -> Result<(), PluginError>;

    /// Optional: provide Tauri commands
    fn commands(&self) -> Vec<PluginCommand> {
        vec![]
    }
}

pub struct PluginContext {
    pub config: Arc<RwLock<AppConfig>>,
    pub event_bus: broadcast::Sender<AppEvent>,
    pub db: Arc<dyn DatabaseProvider>,
}
```

#### 2. Static dispatch (generics) vs dynamic dispatch (trait objects)

| Approach | Dispatch | Pros | Cons |
|----------|----------|------|------|
| Generics | Static, monomorphized | Zero-cost, inlinable | Bloats binary, can't store heterogeneous lists |
| `Box<dyn Trait>` | Dynamic, vtable | Heterogeneous lists, runtime loading | Minor indirection cost, object-safe traits only |

```rust
// Static: use when plugin set is known at compile time
pub struct PluginRegistry<P: Plugin> {
    plugins: Vec<P>,
}

// Dynamic: use when plugins are discovered at runtime
pub struct PluginRegistry {
    plugins: Vec<Box<dyn Plugin>>,
}
```

#### 3. Plugin registration patterns

**Compile-time registration** — discoverable via `inventory` crate:

```rust
// In plugin crate
inventory::submit! {
    MyPlugin::new()
}

// In core
pub fn discover_plugins() -> Vec<&'static dyn Plugin> {
    inventory::iter::<dyn Plugin>.into_iter().collect()
}
```

**Build-time registration** — use `#[plugin_registry]` macro or build script:

```rust
// build.rs regenerates this file
pub fn register_plugins() -> Vec<Box<dyn Plugin>> {
    vec![
        Box::new(plugin_markdown::MarkdownPlugin::new()),
        Box::new(plugin_spellcheck::SpellcheckPlugin::new()),
    ]
}
```

**Runtime registration** — dynamic libraries via `libloading`:

```rust
use libloading::{Library, Symbol};

unsafe {
    let lib = Library::new("plugins/plugin_diagram.so")?;
    let create: Symbol<fn() -> Box<dyn Plugin>> = lib.get(b"create_plugin")?;
    let plugin = create();
    registry.register(plugin);
}
```

#### 4. Plugin lifecycle

```
App start
  → PluginManager::load_all()
    → for each plugin: plugin.init(&ctx)
  → PluginManager::start_all()
    → for each plugin: plugin.start() (if applicable)

App shutdown
  → PluginManager::shutdown_all()
    → for each plugin: plugin.shutdown(&ctx)
    → drop context
```

#### 5. Inversion of Control / Dependency Injection

Pass capabilities (not concrete types) to plugins:

```rust
#[async_trait]
pub trait DatabaseProvider: Send + Sync {
    async fn query(&self, sql: &str) -> Result<Vec<Row>, DbError>;
    async fn execute(&self, sql: &str) -> Result<u64, DbError>;
}

#[async_trait]
pub trait EventBus: Send + Sync {
    fn publish(&self, event: AppEvent);
    fn subscribe(&self, handler: Box<dyn EventHandler>);
}
```

Plugins receive `PluginContext` which holds these capabilities. The core never imports plugin types.

#### 6. Tauri plugin system similarities

Tauri 2 has its own plugin system — `tauri::plugin::Plugin` trait:

```rust
use tauri::plugin::{Plugin, Result};

pub struct MyPlugin;

impl Plugin for MyPlugin {
    fn name(&self) -> &'static str {
        "my-plugin"
    }

    fn initialize(&mut self, app: &AppHandle, _config: Self::Config) -> Result<()> {
        // Register commands, manage state, set up IPC
        Ok(())
    }
}
```

When building your own plugin system, mirror Tauri's patterns: versioned APIs, manifest-based configuration, scoped state access.

### When to use

| Pattern | When |
|---------|------|
| `Box<dyn Plugin>` | Heterogeneous plugins, runtime loading, user extensions |
| Generic `PluginRegistry<P>` | Homogeneous plugins, compile-time known set, zero-cost |
| `inventory` registration | Discoverable plugins without wiring code |
| Dynamic loading (`libloading`) | User-installed plugins, hot-reload, sandboxed code |
| Tauri plugin trait | Tauri-specific extensions (commands, tray, menus) |

### Pros

- Clean separation of core and extension code
- Feature toggles without `#[cfg]` pollution
- Third-party contributions without core access
- Pluggable testing — mock plugins for integration tests
- Runtime extensibility (dynamic loading)

### Cons

- Trait objects require `Send + Sync + 'static` bounds
- Dynamic loading adds complexity and safety concerns (`unsafe`)
- `inventory` relies on link-time registration (Windows DLL issues)
- Plugin API becomes a long-term commitment — breaking changes affect all plugins
- Debugging plugin failures requires better error reporting than core code

### Rust-specific considerations

- `dyn Trait` requires the trait to be object-safe: no generic methods, no `Self: Sized`, no associated consts.
- `async_trait` macro converts `async fn` to `fn(...) -> Pin<Box<dyn Future<Output = T> + Send>>` — adds a heap allocation per call.
- `libloading` is `unsafe` — the plugin must be compiled with the same Rust ABI (same `rustc` version or via `extern "C"` stable ABI).
- `#[no_mangle]` and `extern "C"` are required for dynamic symbol export.
- Version the plugin API trait — add a `api_version() -> u32` method to fail fast on mismatches.
- For Tauri, prefer Tauri's built-in plugin system over custom; use custom plugins for domain logic that Tauri doesn't know about.
- Consider `typetag` crate for serde-deserializable plugins (useful when config declares which plugins to load).