# Flutter to React Provider Migration Guide

This guide explains how the Flutter Provider pattern has been translated to React Context API.

## 📊 Architecture Comparison

### Flutter Architecture
```dart
// Flutter uses ChangeNotifier pattern
class AppProvider extends ChangeNotifier {
  dynamic _user;
  String? _token;
  
  void setUser(dynamic user, String token) {
    _user = user;
    _token = token;
    notifyListeners(); // Triggers UI rebuild
  }
}
```

### React Architecture
```javascript
// React uses Context + Hooks pattern
const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  
  // State changes automatically trigger re-renders
  return (
    <AppContext.Provider value={{ user, token, setUser }}>
      {children}
    </AppContext.Provider>
  );
};
```

## 🔄 Code Migration Examples

### 1. Provider Setup

#### Flutter (lib/main.dart)
```dart
void main() {
  runApp(
    ChangeNotifierProvider(
      create: (context) => AppProvider(),
      child: MyApp(),
    ),
  );
}
```

#### React (src/index.js)
```javascript
import { AppProviders } from './provider';

ReactDOM.render(
  <AppProviders>
    <App />
  </AppProviders>,
  document.getElementById('root')
);
```

### 2. Consuming Provider

#### Flutter Widget
```dart
class DashboardScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final appProvider = Provider.of<AppProvider>(context);
    final user = appProvider.user;
    final isLoggedIn = appProvider.isLoggedIn;
    
    return Scaffold(
      appBar: AppBar(title: Text('Welcome ${user.fullName}')),
      body: isLoggedIn ? Dashboard() : LoginPrompt(),
    );
  }
}
```

#### React Component
```javascript
import { useApp } from './provider';

function DashboardScreen() {
  const { user, isLoggedIn } = useApp();
  
  return (
    <div>
      <header>Welcome {user.fullName}</header>
      {isLoggedIn ? <Dashboard /> : <LoginPrompt />}
    </div>
  );
}
```

### 3. Updating State

#### Flutter
```dart
// In a widget/service
final appProvider = Provider.of<AppProvider>(context, listen: false);
appProvider.setUser(userData, token);
```

#### React
```javascript
// In a component
const { setUser } = useApp();
setUser(userData, token);
```

### 4. Authentication Flow

#### Flutter Login
```dart
class LoginService {
  Future<void> login(BuildContext context, String email, String password) async {
    final response = await http.post(loginUrl, body: {
      'email': email,
      'password': password,
    });
    
    final data = json.decode(response.body);
    final user = Admin.fromMap(data['user']);
    final token = data['token'];
    
    final appProvider = Provider.of<AppProvider>(context, listen: false);
    appProvider.setUser(user, token);
  }
}
```

#### React Login
```javascript
import { useApp, useNotification } from './provider';
import { Admin } from './models';

function useLogin() {
  const { setUser } = useApp();
  const { success, error } = useNotification();
  
  const login = async (email, password) => {
    try {
      const response = await fetch(loginUrl, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      const user = Admin.fromJSON(data.user);
      const token = data.token;
      
      setUser(user, token);
      success('Login successful');
    } catch (err) {
      error('Login failed');
    }
  };
  
  return { login };
}
```

### 5. Role-Based Access

#### Flutter
```dart
Widget build(BuildContext context) {
  final appProvider = Provider.of<AppProvider>(context);
  
  if (!appProvider.isLoggedIn) {
    return LoginScreen();
  }
  
  if (appProvider.isDoctor) {
    return DoctorDashboard();
  } else if (appProvider.isAdmin) {
    return AdminDashboard();
  }
  
  return Unauthorized();
}
```

#### React
```javascript
function Dashboard() {
  const { isLoggedIn, isDoctor, isAdmin } = useApp();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }
  
  if (isDoctor) {
    return <DoctorDashboard />;
  } else if (isAdmin) {
    return <AdminDashboard />;
  }
  
  return <Unauthorized />;
}

// Or use HOC
export default withRole(Dashboard, ['doctor', 'admin']);
```

### 6. Logout Flow

#### Flutter
```dart
class LogoutButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: () {
        final appProvider = Provider.of<AppProvider>(context, listen: false);
        appProvider.signOut();
        Navigator.of(context).pushReplacementNamed('/login');
      },
      child: Text('Logout'),
    );
  }
}
```

#### React
```javascript
function LogoutButton() {
  const { signOut } = useApp();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    signOut();
    navigate('/login');
  };
  
  return <button onClick={handleLogout}>Logout</button>;
}
```

## 🎯 Key Differences

| Aspect | Flutter | React |
|--------|---------|-------|
| **State Management** | ChangeNotifier | Context + Hooks |
| **Subscription** | Provider.of() or Consumer | useContext() / Custom hooks |
| **Updates** | notifyListeners() | setState() auto-triggers |
| **Listen parameter** | listen: false | Not needed (hooks are always responsive) |
| **Multiple Providers** | MultiProvider | Nested Providers |
| **Performance** | Selector for optimization | useMemo / useCallback |
| **Persistence** | Manual (SharedPreferences) | localStorage (built into AppContext) |

## 🚀 Enhanced Features in React Implementation

The React implementation includes several enhancements not present in the original Flutter version:

### 1. Automatic Persistence
```javascript
// Automatically saves to localStorage
const { setUser } = useApp();
setUser(user, token); // Automatically persisted

// On app reload, automatically restores from localStorage
```

### 2. Multiple Specialized Contexts
```javascript
// Flutter has only AppProvider
// React has multiple focused contexts:
- AppContext        // Auth & user
- ThemeContext      // UI preferences
- NotificationContext // Toast messages
- LoadingContext    // Loading states
- NavigationContext // Breadcrumbs & navigation
```

### 3. Custom Hooks for Common Patterns
```javascript
// Simplified API calls
const { callApi } = useApiCall();
const result = await callApi(fetchPatients);

// Form submissions
const { submitForm } = useFormSubmit();
await submitForm(savePatient);

// Pagination
const { page, nextPage, prevPage } = usePagination();
```

### 4. HOC for Route Protection
```javascript
// Declarative route protection
export default withAuth(MyComponent);
export default withRole(AdminPanel, ['admin']);
```

## 📝 Migration Checklist

- [x] Create AppContext (equivalent to AppProvider)
- [x] Add localStorage persistence
- [x] Create additional contexts (Theme, Notification, etc.)
- [x] Implement custom hooks
- [x] Add HOCs for route protection
- [x] Create combined AppProviders wrapper
- [x] Add TypeScript support (optional)
- [x] Write documentation
- [ ] Migrate all screens to use new providers
- [ ] Update authentication service
- [ ] Update API services to use token from context
- [ ] Add error boundaries
- [ ] Add performance monitoring

## 🔧 Next Steps

1. **Update Main App**
   - Wrap app with `<AppProviders>`
   - Remove old Redux/MobX if present

2. **Update Components**
   - Replace prop drilling with context hooks
   - Convert class components to functional + hooks

3. **Update Services**
   - Use `useApp()` for token access
   - Use `useNotification()` for user feedback

4. **Add Error Handling**
   - Implement error boundaries
   - Add global error context

5. **Testing**
   - Test authentication flow
   - Test role-based access
   - Test persistence

## 💡 Pro Tips

1. **Use custom hooks** instead of direct context access for better abstraction
2. **Combine contexts judiciously** - don't create context explosion
3. **Memoize expensive computations** with useMemo
4. **Use useCallback** for functions passed to children
5. **Keep context values stable** to prevent unnecessary re-renders
6. **Split large contexts** into smaller, focused ones
7. **Use context for truly global state** only

## 🐛 Troubleshooting

### Provider Not Found Error
**Problem**: "useApp must be used within an AppProvider"

**Solution**: Ensure component tree is wrapped with AppProviders:
```javascript
<AppProviders>
  <YourComponent />
</AppProviders>
```

### State Not Updating
**Problem**: Component doesn't re-render on state change

**Solution**: Make sure you're using the hook, not accessing context directly:
```javascript
// ❌ Wrong
const context = useContext(AppContext);

// ✅ Correct
const { user } = useApp();
```

### Infinite Re-renders
**Problem**: Component keeps re-rendering

**Solution**: Wrap functions in useCallback:
```javascript
const handleClick = useCallback(() => {
  doSomething();
}, [dependencies]);
```

## 📚 Additional Resources

- [React Context API Documentation](https://react.dev/reference/react/useContext)
- [Flutter Provider Package](https://pub.dev/packages/provider)
- [React Hooks Guide](https://react.dev/reference/react)
- [State Management Comparison](https://react.dev/learn/scaling-up-with-reducer-and-context)
