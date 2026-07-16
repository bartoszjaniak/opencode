# Flutter Testing — Wzorce i najlepsze praktyki

Flutter ma trzy poziomy testów: **unit**, **widget** i **integration**.

## Testy jednostkowe (Unit Tests)

Testowanie logiki biznesowej — ViewModel, Repository, serwisy.

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';

// Z mockito
class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late AuthViewModel sut;
  late MockAuthRepository mockRepo;

  setUp(() {
    mockRepo = MockAuthRepository();
    sut = AuthViewModel(mockRepo);
  });

  group('LoginViewModel', () {
    test('initial state is correct', () {
      expect(sut.isLoading, false);
      expect(sut.errorMessage, null);
    });

    test('sets isLoading to true during login', () async {
      when(mockRepo.login(any)).thenAnswer((_) async => true);
      
      final future = sut.onLoginPressed();
      expect(sut.isLoading, true);
      await future;
    });

    test('sets error message on failure', () async {
      when(mockRepo.login(any)).thenThrow(Exception('Network error'));
      
      await sut.onLoginPressed();
      expect(sut.errorMessage, isNotNull);
    });
  });
}
```

## Testy widgetów (Widget Tests)

Testowanie komponentów UI z możliwością interakcji.

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

void main() {
  testWidgets('LoginView shows error on empty email', (tester) async {
    // Arrange
    await tester.pumpWidget(
      MaterialApp(
        home: ChangeNotifierProvider(
          create: (_) => LoginViewModel(MockAuthRepository()),
          child: const LoginView(),
        ),
      ),
    );

    // Act — tap login button
    await tester.tap(find.text('Login'));
    await tester.pumpAndSettle();

    // Assert
    expect(find.text('Email is required'), findsOneWidget);
  });
}
```

### Kluczowe metody testera

| Metoda | Zastosowanie |
|--------|-------------|
| `tester.pumpWidget(widget)` | Renderuje widget |
| `tester.pump()` | Przerysowuje (1 frame) |
| `tester.pumpAndSettle()` | Czeka na zakończenie animacji |
| `tester.tap(finder)` | Symuluje tapnięcie |
| `tester.enterText(finder, text)` | Wprowadza tekst |
| `tester.drag(finder, offset)` | Symuluje przeciągnięcie |
| `tester.scrollUntilVisible(finder, offset)` | Scrolluje do znalezienia |

### Finders (wyszukiwanie widgetów)

```dart
find.text('Login')                    // po tekście
find.byType(ElevatedButton)           // po typie
find.byKey(const Key('loginBtn'))     // po kluczu
find.byIcon(Icons.add)                // po ikonie
find.widgetWithText(TextField, 'Email') // po typie + tekście
```

### Matchers (asercje)

```dart
expect(find.text('Hello'), findsOneWidget);     // dokładnie 1
expect(find.text('Hello'), findsWidgets);        // 1 lub więcej
expect(find.text('Hello'), findsNothing);        // 0
expect(find.byType(TextField), findsNWidgets(2)); // dokładnie N
```

## Testy integracyjne (Integration Tests)

Testowanie całej aplikacji na prawdziwym urządzeniu/emulatorze.

```dart
// test_driver/app.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('full login flow', (tester) async {
    await tester.pumpWidget(const MyApp());
    
    // Enter email
    await tester.enterText(find.byType(TextField), 'test@example.com');
    await tester.tap(find.text('Login'));
    await tester.pumpAndSettle();
    
    // Assert home screen is shown
    expect(find.text('Welcome'), findsOneWidget);
  });
}
```

## Mockowanie

### mockito (najpopularniejsze)

```dart
// W pubspec.yaml:
// dev_dependencies:
//   mockito: ^5.4.0
//   build_runner: ^2.4.0

// Generowanie: dart run build_runner build

@GenerateMocks([AuthRepository])
void main() { /* ... */ }
```

### Mockito bez generatora (ręczne)

```dart
class MockAuthRepository extends Mock implements AuthRepository {}
```

## Konfiguracja pubspec.yaml

```yaml
dev_dependencies:
  flutter_test:
    sdk: flutter
  integration_test:
    sdk: flutter
  mockito: ^5.4.0
  build_runner: ^2.4.0
```

## Uruchamianie testów

```bash
flutter test                        # unit + widget tests
flutter test test/widget_test.dart  # konkretny plik
flutter test --coverage             # z coverage
flutter test --reporter expanded    # verbose output

# Testy integracyjne (na urządzeniu)
flutter test integration_test/
```

## Dobre praktyki

1. **Testuj ViewModel, nie View** — logika w ViewModel jest łatwiejsza do testowania
2. **Unikaj `pumpAndSettle` w nieskończoność** — ustaw timeout
3. **Używaj `setUp` i `tearDown`** — resetuj stan między testami
4. **Mockuj zależności** — nie testuj prawdziwych API/baz danych
5. **Testuj stany brzegowe** — loading, error, empty, success
6. **Nazwy testów opisowe** — "login with valid credentials shows home screen"