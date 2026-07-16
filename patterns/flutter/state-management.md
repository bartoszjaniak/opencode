# Flutter State Management — Wzorce i najlepsze praktyki

## Podział: Ephemeral vs App State

- **Ephemeral state** — stan lokalny widgetu (np. `_isChecked`), użyj `setState`
- **App state** — stan współdzielony (np. zalogowany użytkownik), użyj rozwiązania globalnego

## Wbudowane podejścia

### setState (dla prostego, lokalnego stanu)

```dart
class CounterWidget extends StatefulWidget {
  @override
  State<CounterWidget> createState() => _CounterWidgetState();
}

class _CounterWidgetState extends State<CounterWidget> {
  int _count = 0;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text('$_count'),
        ElevatedButton(
          onPressed: () => setState(() => _count++),
          child: const Text('+1'),
        ),
      ],
    );
  }
}
```

### ValueNotifier / ValueListenableBuilder

```dart
final counter = ValueNotifier<int>(0);

ValueListenableBuilder<int>(
  valueListenable: counter,
  builder: (context, value, child) {
    return Text('$value');
  },
);
```

### ChangeNotifier / ListenableBuilder

```dart
class CartViewModel extends ChangeNotifier {
  final List<Item> _items = [];
  
  int get itemCount => _items.length;
  bool get isEmpty => _items.isEmpty;
  
  void addItem(Item item) {
    _items.add(item);
    notifyListeners();
  }
}

// W widgecie:
ListenableBuilder(
  listenable: cartViewModel,
  builder: (context, _) {
    if (cartViewModel.isEmpty) return const Text('Cart is empty');
    return Text('${cartViewModel.itemCount} items');
  },
);
```

## Pakiety społeczności

| Pakiet | Zastosowanie | pub.dev |
|--------|-------------|--------|
| **provider** | Najprostszy DI + state (oparty na `InheritedWidget`) | `provider` |
| **riverpod** | Nowoczesny, type-safe, testowalny | `flutter_riverpod` |
| **bloc** | Event-driven, przewidywalny, skaluje się | `flutter_bloc` |
| **flutter_command** | Command pattern (MVVM) | `flutter_command` |
| **get_it** | DI kontener (służy do wstrzykiwania zależności) | `get_it` |

### Provider (najpopularniejszy, prosty start)

```dart
// 1. Zdefiniuj ChangeNotifier
class Counter extends ChangeNotifier {
  int _count = 0;
  int get count => _count;
  void increment() { _count++; notifyListeners(); }
}

// 2. Provide w drzewie
MultiProvider(
  providers: [
    ChangeNotifierProvider(create: (_) => Counter()),
  ],
  child: const MyApp(),
);

// 3. Konsumuj
final counter = context.watch<Counter>();  // rebuild przy zmianie
final counter = context.read<Counter>();   // bez rebuildu
```

### Riverpod (nowoczesny, testowalny)

```dart
// 1. Provider
final counterProvider = StateNotifierProvider<CounterNotifier, int>((ref) {
  return CounterNotifier();
});

// 2. UI
final count = ref.watch(counterProvider);
ref.read(counterProvider.notifier).increment();
```

### Bloc (skalowalny, event-driven)

```dart
// Event
sealed class CounterEvent {}
final class Increment extends CounterEvent {}

// Bloc
class CounterBloc extends Bloc<CounterEvent, int> {
  CounterBloc() : super(0) {
    on<Increment>((event, emit) => emit(state + 1));
  }
}

// UI
BlocBuilder<CounterBloc, int>(
  builder: (context, count) => Text('$count'),
);
```

## Zależności (DI)

### Ręczne DI (proste, bez pakietów)

```dart
class App extends StatelessWidget {
  final authRepository = AuthRepository();
  final userRepository = UserRepository();

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthViewModel(authRepository)),
        ChangeNotifierProvider(create: (_) => UserViewModel(userRepository)),
      ],
      child: const MaterialApp(home: HomeView()),
    );
  }
}
```

### get_it (DI kontener)

```dart
final getIt = GetIt.instance;

void setupDI() {
  getIt.registerSingleton<AuthRepository>(AuthRepository());
  getIt.registerFactory<AuthViewModel>(() => AuthViewModel(getIt<AuthRepository>()));
}

// Użycie
final vm = getIt<AuthViewModel>();
```

## Rekomendacje

| Aplikacja | Zalecane podejście |
|-----------|-------------------|
| Mała (1-2 ekrany) | `setState` + `ValueNotifier` |
| Średnia (3-10 ekranów) | `provider` + `ChangeNotifier` |
| Duża (10+ ekranów, zespół) | `riverpod` lub `bloc` |
| MVVM (Flutter official) | `provider` + ViewModel pattern |