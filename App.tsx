import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import Splash from './src/screens/Splash';
import Onboarding from './src/screens/Onboarding';
import AccountType from './src/screens/AccountType';
import PhoneLogin from './src/screens/PhoneLogin';
import OTPVerification from './src/screens/OTPVerification';
import CreatePin from './src/screens/CreatePin';
import Personalization from './src/screens/Personalization';
import SignIn from './src/screens/SignIn';
import EnterSignInPin from './src/screens/EnterSignInPin';
import Home from './src/screens/home';
import Categories from './Unused Screens/Categories';
import Groceries from './src/screens/Groceries';
import ProductDetails from './src/screens/ProductDetails';
import MyCart from './src/screens/MyCart';
import PaymentConfirm from './src/screens/PaymentConfirm';
import EnterPin from './src/screens/EnterPin';
import PaymentSuccess from './src/screens/PaymentSuccess';
import MyOrders from './src/screens/MyOrders';
import OrderDetails from './src/screens/OrderDetails';
import MyWallet from './src/screens/MyWallet';
import SendMoney from './src/screens/SendMoney';
import Profile from './src/screens/ShopProfile';
import Account from './src/screens/Account';
import SearchResults from './src/screens/SearchResults';
import ShopProfile from './src/screens/ShopProfile';
import ServicesHome from './src/screens/ServicesHome';
import PlumbingServices from './src/screens/PlumbingServices';
import ServiceProviderProfile from './src/screens/ServiceProviderProfile';
import BookService from './src/screens/BookService';
import BookingConfirmed from './src/screens/BookingConfirmed';
import ShopOwnerDashboard from './src/screens/ShopOwnerDashboard';
import SellerProducts from './src/screens/SellerProducts';
import SellerOrders from './src/screens/SellerOrders';
import SellerWallet from './src/screens/SellerWallet';
import SellerAccount from './src/screens/SellerAccount';
import ServiceProviderDashboard from './src/screens/ServiceProviderDashboard';
import ServiceProviderBookings from './src/screens/ServiceProviderBookings';
import ServiceProviderServices from './src/screens/ServiceProviderServices';
import ServiceProviderEarnings from './src/screens/ServiceProviderEarnings';
import ServiceProviderProfileScreen from './src/screens/ServiceProviderProfileScreen';
import TopUp from './src/screens/TopUp';
import AddProduct from './src/screens/AddProduct';
import SetPriceStock from './src/screens/SetPriceStock';
import ReviewPublish from './src/screens/ReviewPublish';
import Messages from './src/screens/Messages';
import RouteNavigation from './src/screens/RouteNavigation';
import Notifications from './src/screens/Notifications';
import Connections from './src/screens/Connections';
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="MyOrders"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="Splash" component={Splash} />
            <Stack.Screen name="Onboarding" component={Onboarding} />
            <Stack.Screen name="AccountType" component={AccountType} />
            <Stack.Screen name="PhoneLogin" component={PhoneLogin} />
            <Stack.Screen name="OTPVerification" component={OTPVerification} />
            <Stack.Screen name="CreatePin" component={CreatePin} />
            <Stack.Screen name="Personalization" component={Personalization} />
            <Stack.Screen name="SignIn" component={SignIn} />
            <Stack.Screen name="EnterSignInPin" component={EnterSignInPin} />
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="Categories" component={Categories} />
            <Stack.Screen name="Groceries" component={Groceries} />
            <Stack.Screen name="ProductDetails" component={ProductDetails} />
            <Stack.Screen name="MyCart" component={MyCart} />
            <Stack.Screen name="PaymentConfirm" component={PaymentConfirm} />
            <Stack.Screen name="EnterPin" component={EnterPin} />
            <Stack.Screen name="PaymentSuccess" component={PaymentSuccess} />
            <Stack.Screen name="MyOrders" component={MyOrders} />
            <Stack.Screen name="OrderDetails" component={OrderDetails} />
            <Stack.Screen name="MyWallet" component={MyWallet} />
            <Stack.Screen name="SendMoney" component={SendMoney} />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="Account" component={Account} />
            <Stack.Screen name="SearchResults" component={SearchResults} />
            <Stack.Screen name="ShopProfile" component={ShopProfile} />
            <Stack.Screen name="ServicesHome" component={ServicesHome} />
            <Stack.Screen name="PlumbingServices" component={PlumbingServices} />
            <Stack.Screen name="ServiceProviderProfile" component={ServiceProviderProfile} />
            <Stack.Screen name="BookService" component={BookService} />
            <Stack.Screen name="BookingConfirmed" component={BookingConfirmed} />
            <Stack.Screen name="ShopOwnerDashboard" component={ShopOwnerDashboard} />
            <Stack.Screen name="SellerProducts" component={SellerProducts} />
            <Stack.Screen name="SellerOrders" component={SellerOrders} />
            <Stack.Screen name="SellerWallet" component={SellerWallet} />
            <Stack.Screen name="SellerAccount" component={SellerAccount} />
            <Stack.Screen name="ServiceProviderDashboard" component={ServiceProviderDashboard} />
            <Stack.Screen name="ServiceProviderBookings" component={ServiceProviderBookings} />
            <Stack.Screen name="ServiceProviderServices" component={ServiceProviderServices} />
            <Stack.Screen name="ServiceProviderEarnings" component={ServiceProviderEarnings} />
            <Stack.Screen name="ServiceProviderProfileScreen" component={ServiceProviderProfileScreen} />
            <Stack.Screen name="TopUp" component={TopUp} />
            <Stack.Screen name="AddProduct" component={AddProduct} />
            <Stack.Screen name="SetPriceStock" component={SetPriceStock} />
            <Stack.Screen name="ReviewPublish" component={ReviewPublish} />
            <Stack.Screen name="Messages" component={Messages} />
            <Stack.Screen name="RouteNavigation" component={RouteNavigation} />
            <Stack.Screen name="Notifications" component={Notifications} />
            <Stack.Screen name="Connections" component={Connections} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </AuthProvider>
  );
}

