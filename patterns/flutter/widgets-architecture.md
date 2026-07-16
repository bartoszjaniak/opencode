# Flutter Widgets & Architecture — Wzorce i najlepsze praktyki

## Struktura projektu

```
my_app/
├── lib/
│   ├── main.dart              # entrypoint
│   ├── app.dart               # MaterialApp/CupertinoApp
│   ├── app_theme.dart         # ThemeData
│   ├── core/                  # współdzielone klasy
│   │   ├── constants/
│   │   ├── extensions/
│   │   ├── utils/
│   │   └── widgets/
│   ├── features/              # feature-based podział
│   │   ├── auth/
│   │   │   ├── auth_view.dart
│   │   │   ├── auth_view_model.dart
│   │   │   └── auth_repository.dart
│   │   ├── home/
│   │   │   ├── home_view.dart
│   │   │   ├── home_view_model.dart
│   │   │   └── home_repository.dart
│   │   └── ...
│   ├── data/                  # warstwa danych
│   │   ├── models/            # DTO, JSON serializacja
│   │   ├── repositories/      # implementacje repozytoriów
│   │   └── services/          # API clients, database
│   └── l10n/                  # lokalizacja (ARB files)
├── test/
│   ├── unit/
│   ├── widget/
│   └── integration/
├── pubspec.yaml
└── analysis_options.yaml
```

## Architektura MVVM (zalecana przez Flutter)

### View (Widget)
- Tylko logika UI: layout, animacje, warunkowe pokazywanie
- Żadnej logiki biznesowej
- Otrzymuje dane z ViewModel przez `ValueNotifier`, `Stream` lub `ChangeNotifier`

```dart
class LoginView extends StatelessWidget {
  const LoginView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ListenableBuilder(
        listenable: context.viewModel,
        builder: (context, _) {
          final vm = context.viewModel;
          return Column(
            children: [
              TextField(
                onChanged: vm.onEmailChanged,
                decoration: const InputDecoration(labelText: 'Email'),
              ),
              if (vm.isLoading) const CircularProgressIndicator(),
              ElevatedButton(
                onPressed: vm.onLoginPressed,
                child: const Text('Login'),
              ),
            ],
          );
        },
      ),
    );
  }
}
```

### ViewModel
- Zarządza stanem UI
- Transformuje dane z repozytoriów do formatu UI
- Eksponuje komendy (callbacki) dla View
- Testowalny bez widgetów

```dart
class LoginViewModel extends ChangeNotifier {
  final AuthRepository _authRepository;

  String _email = '';
  bool _isLoading = false;
  String? _errorMessage;

  LoginViewModel(this._authRepository);

  String get email => _email;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  void onEmailChanged(String value) {
    _email = value;
    notifyListeners();
  }

  Future<void> onLoginPressed() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _authRepository.login(_email);
    } catch (e) {
      _errorMessage = 'Login failed';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
```

## Podstawowe widgety (must-know)

| Widget | Zastosowanie |
|--------|-------------|
| `Container` | Pojemnik z padding, margin, decoration |
| `Row` / `Column` | Layout poziomy/pionowy |
| `Stack` | Nakładanie widgetów na siebie |
| `Expanded` / `Flexible` | Elastyczne wypełnianie przestrzeni |
| `ListView.builder` | Listy (leniwe ładowanie) |
| `GridView.builder` | Siatki (leniwe ładowanie) |
| `SingleChildScrollView` | Przewijanie pojedynczego dziecka |
| `SafeArea` | Unikanie notcha i pasków systemowych |
| `MediaQuery` | Informacje o rozmiarze ekranu |
| `GestureDetector` / `InkWell` | Obsługa dotyku |
| `Text` / `RichText` | Wyświetlanie tekstu |
| `Image.network` / `Image.asset` | Obrazy |
| `StreamBuilder` / `FutureBuilder` | Async UI |
| `AnimatedContainer` / `AnimatedOpacity` | Proste animacje |

## Dart konwencje (Effective Dart)

- **Typy**: `UpperCamelCase` — `class UserModel`
- **Funkcje/pola**: `lowerCamelCase` — `getUser()`
- **Pliki**: `snake_case` — `user_repository.dart`
- **Stałe**: `lowerCamelCase` — `const defaultPadding`
- **Importy**: `dart:` → `package:` → relative (z sekcjami)
- **Używaj `final`** domyślnie, `var` tylko gdy typ jest oczywisty
- **Używaj `const`** gdzie tylko możliwe (wydajność)
- **Preferuj `=>`** dla prostych getterów/metod
- **Unikaj `new`** i zbędnego `const` (Dart 2+)

## Layout i Constraints

- **Constraints go down, sizes go up, parent sets position**
- `Container` bez dziecka: wypełnia rodzica
- `SizedBox` dla stałych wymiarów
- `ConstrainedBox` / `BoxConstraints` dla ograniczeń
- `LayoutBuilder` dla dynamicznych layoutów

## Material 3 (zalecane)

```dart
MaterialApp(
  theme: ThemeData(
    useMaterial3: true,
    colorSchemeSeed: Colors.blue,
  ),
)
```

## Wydajność

- Używaj `const` konstruktorów — mniej rebuildów
- `ListView.builder` dla długich list (nie `ListView(children:[])`)
- Unikaj zbędnych rebuildów — `RepaintBoundary`
- Izoluj przewijanie — `ScrollController` z `addListener`
- Ciężkie obliczenia — `compute()` lub isolate