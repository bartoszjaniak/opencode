# Flutter Data Layer — Networking & Persistence

## Networking z `http` / `dio`

### Podstawowe żądanie (http)

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class ApiService {
  final http.Client _client;

  ApiService(this._client);

  Future<List<User>> fetchUsers() async {
    final response = await _client.get(
      Uri.parse('https://api.example.com/users'),
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => User.fromJson(json)).toList();
    } else {
      throw ApiException('Failed to load users', response.statusCode);
    }
  }
}
```

### Z dio (bardziej zaawansowany)

```dart
import 'package:dio/dio.dart';

class ApiClient {
  late final Dio _dio;

  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: 'https://api.example.com',
      connectTimeout: const Duration(seconds: 5),
      receiveTimeout: const Duration(seconds: 3),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(LogInterceptor(responseBody: true));
    _dio.interceptors.add(InterceptorsWrapper(
      onError: (error, handler) {
        if (error.response?.statusCode == 401) {
          // refresh token
        }
        handler.next(error);
      },
    ));
  }

  Future<List<User>> getUsers() async {
    final response = await _dio.get('/users');
    return (response.data as List).map((j) => User.fromJson(j)).toList();
  }
}
```

## JSON Serializacja

### Ręczna (dla prostych modeli)

```dart
class User {
  final int id;
  final String name;
  final String email;

  const User({required this.id, required this.name, required this.email});

  factory User.fromJson(Map<String, dynamic> json) => User(
    id: json['id'] as int,
    name: json['name'] as String,
    email: json['email'] as String,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'email': email,
  };
}
```

### Z `json_serializable` (zalecane dla dużych projektów)

```dart
import 'package:json_annotation/json_annotation.dart';

part 'user.g.dart';

@JsonSerializable()
class User {
  final int id;
  final String name;
  final String email;

  const User({required this.id, required this.name, required this.email});

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  Map<String, dynamic> toJson() => _$UserToJson(this);
}
```

```yaml
# pubspec.yaml
dependencies:
  json_annotation: ^4.9.0
dev_dependencies:
  json_serializable: ^6.7.0
  build_runner: ^2.4.0
```

## Repository Pattern

```dart
class UserRepository {
  final ApiClient _apiClient;
  final LocalDatabase _localDb;

  UserRepository(this._apiClient, this._localDb);

  Future<List<User>> getUsers() async {
    try {
      final users = await _apiClient.getUsers();
      await _localDb.saveUsers(users); // cache lokalny
      return users;
    } catch (e) {
      // Fallback do cache'a
      return await _localDb.getUsers();
    }
  }
}
```

## Persistence (bazy danych)

### shared_preferences (klucz-wartość)

```dart
import 'package:shared_preferences/shared_preferences.dart';

class PreferencesService {
  Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }
}
```

### drift (SQLite) — zalecane dla złożonych danych

```dart
import 'package:drift/drift.dart';
import 'package:drift/native.dart';

class Users extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get name => text()();
  TextColumn get email => text().unique()();
}

@DriftDatabase(tables: [Users])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(NativeDatabase.memory());

  @override
  int get schemaVersion => 1;

  Future<List<User>> getAllUsers() => select(users).get();
  Future<void> insertUser(User user) => into(users).insert(user);
}
```

### isar (NoSQL, szybki, nowoczesny)

```dart
import 'package:isar/isar.dart';

@collection
class User {
  Id? id;
  late String name;
  late String email;
}

// Użycie
final isar = await Isar.open([UserSchema]);
await isar.writeTxn(() => isar.users.put(user));
final users = await isar.users.where().findAll();
```

## Firebase

```yaml
dependencies:
  firebase_core: ^3.0.0
  firebase_auth: ^5.0.0
  cloud_firestore: ^5.0.0
```

```dart
import 'package:firebase_auth/firebase_auth.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  Future<User?> signIn(String email, String password) async {
    final result = await _auth.signInWithEmailAndPassword(
      email: email,
      password: password,
    );
    return result.user;
  }
}
```

## Streamy i WebSocket

```dart
import 'dart:async';
import 'package:web_socket_channel/web_socket_channel.dart';

class WebSocketService {
  WebSocketChannel? _channel;

  Stream<String> connect(String url) {
    _channel = WebSocketChannel.connect(Uri.parse(url));
    return _channel!.stream.map((data) => data as String);
  }

  void send(String message) {
    _channel?.sink.add(message);
  }

  void disconnect() {
    _channel?.sink.close();
  }
}
```

## Dobre praktyki

1. **Repository pattern** — oddziel API od reszty aplikacji
2. **Offline-first** — cache lokalny + fallback
3. **Error handling** — zawsze obsługuj błędy sieciowe
4. **Timeout** — ustaw timeout na żądania
5. **Interceptors** — logowanie, auth token refresh
6. **Testowalność** — wstrzykuj klienta HTTP przez konstruktor