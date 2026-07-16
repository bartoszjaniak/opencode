# Flutter Nawigacja, Routing i Wydajność

## Nawigacja wbudowana (Navigator 2.0 / go_router)

### router (zalecany — go_router)

```dart
import 'package:go_router/go_router.dart';

final goRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const HomeView(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginView(),
    ),
    GoRoute(
      path: '/users/:id',
      builder: (context, state) => UserDetailView(
        userId: int.parse(state.pathParameters['id']!),
      ),
    ),
  ],
);

// Użycie w MaterialApp
MaterialApp.router(
  routerConfig: goRouter,
  // ...
)

// Nawigacja
context.go('/login');           // push
context.go('/users/42');        // z parametrem
context.pop();                  // back
context.replace('/home');       // replace
```

### Nawigacja deklaratywna z ochroną (auth guard)

```dart
final goRouter = GoRouter(
  redirect: (context, state) {
    final isLoggedIn = context.read<AuthViewModel>().isLoggedIn;
    final isLoginRoute = state.matchedLocation == '/login';

    if (!isLoggedIn && !isLoginRoute) return '/login';
    if (isLoggedIn && isLoginRoute) return '/';
    return null;
  },
  routes: [/* ... */],
);
```

## Animacje

### Implicit animations (proste, deklaratywne)

```dart
AnimatedContainer(
  duration: const Duration(milliseconds: 300),
  width: isExpanded ? 200 : 100,
  height: isExpanded ? 200 : 100,
  color: isExpanded ? Colors.blue : Colors.red,
);

AnimatedOpacity(
  opacity: isVisible ? 1.0 : 0.0,
  duration: const Duration(milliseconds: 300),
  child: const Text('Fade me'),
);
```

### Explicit animations (pełna kontrola)

```dart
class _MyWidgetState extends State<MyWidget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    );
    _animation = Tween(begin: 0.0, end: 1.0).animate(_controller);
    _controller.forward();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _animation,
      child: const Text('Hello'),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}
```

### Hero animation (przejścia między ekranami)

```dart
// Ekran 1
Hero(
  tag: 'avatar_${user.id}',
  child: CircleAvatar(backgroundImage: NetworkImage(user.avatarUrl)),
);

// Ekran 2
Hero(
  tag: 'avatar_${user.id}',
  child: Image.network(user.avatarUrl, width: 200, height: 200),
);
```

## Wydajność

### const konstruktory

```dart
// Dobrze — const zapobiega rebuildom
const Text('Hello');
const Padding(padding: EdgeInsets.all(8), child: Text('Hello'));

// Źle — tworzy nowy widget przy każdym rebuildzie
Text('Hello');
Padding(padding: const EdgeInsets.all(8), child: const Text('Hello'));
```

### Leniwe listy

```dart
// Dobrze — leniwe ładowanie
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) => ListTile(title: Text(items[index])),
);

// Źle — wszystkie dzieci od razu w pamięci
ListView(children: items.map((e) => ListTile(title: Text(e))).toList());
```

### RepaintBoundary

```dart
// Izoluj przewijanie — nie przerysowuj całej listy
RepaintBoundary(
  child: ListView.builder(
    itemCount: 1000,
    itemBuilder: (context, index) => RepaintBoundary(
      child: ListTile(title: Text('Item $index')),
    ),
  ),
);
```

### Unikaj zbędnych rebuildów

```dart
// Dobrze — tylko zainteresowany widget się rebuilduje
Consumer<CartViewModel>(
  builder: (context, cart, _) => Text('${cart.itemCount} items'),
);

// Źle — cały widget rebuilduje się przy każdej zmianie
ListenableBuilder(
  listenable: cartViewModel,
  builder: (context, _) => Column(
    children: [
      Text('${cartViewModel.itemCount} items'),  // interesuje nas
      const MyStaticWidget(),                      // nie potrzebuje rebuildu
    ],
  ),
);
```

### Ciężkie obliczenia (Isolate)

```dart
import 'dart:isolate';

Future<int> calculateHeavyResponse() async {
  final result = await Isolate.run(() {
    // ciężkie obliczenia w osobnym isolate
    return computeHeavyThing();
  });
  return result;
}
```

### const vs final vs var

```dart
const defaultPadding = 16.0;  // compile-time constant
final apiUrl = Uri.parse('https://api.example.com');  // runtime constant
var counter = 0;  // mutable
```

## Theme i Styling

```dart
MaterialApp(
  theme: ThemeData(
    useMaterial3: true,
    colorSchemeSeed: Colors.indigo,
    appBarTheme: const AppBarTheme(
      centerTitle: true,
      elevation: 0,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        minimumSize: const Size(double.infinity, 48),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
      ),
    ),
  ),
);
```

## Dostępność (Accessibility)

```dart
// Semantyka dla czytników ekranu
Semantics(
  label: 'Close button',
  hint: 'Closes the dialog',
  child: IconButton(icon: const Icon(Icons.close), onPressed: () {}),
);

// Minimum rozmiar tappable: 48x48
// Kontrast: minimum 4.5:1 dla tekstu
// Używaj MediaQuery.textScaleFactor dla skalowalnego tekstu
```