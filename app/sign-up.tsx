import { Feather } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Animated, {
  FadeInRight,
  FadeOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import data from '../config.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Address {
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  latitude: number;
  longitude: number;
}
interface FormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string;
  gender: string;
  license_number: string;
  years_of_experience: string;
  bio: string;
  profile_picture_url: string;
  address: Address;
}
const initialFormData: FormData = {
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  phone_number: '',
  date_of_birth: '',
  gender: '',
  license_number: '',
  years_of_experience: '',
  bio: '',
  profile_picture_url: '',
  address: {
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    latitude: 19.076,
    longitude: 72.8777,
  },
};

export default function SignUpScreen() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // --- ANIMATION VALUE FOR BUTTON PRESS ---
  const scale = useSharedValue(1);
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleButtonPressIn = () => {
    scale.value = withSpring(0.95);
  };
  const handleButtonPressOut = () => {
    scale.value = withSpring(1);
  };

  // --- LOCATION FETCH ---
  useEffect(() => {
    const getLocation = async () => {
      setLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        setLoading(false);
        return;
      }
      try {
        let currentLocation = await Location.getCurrentPositionAsync({});
        handleAddressChange('latitude', currentLocation.coords.latitude);
        handleAddressChange('longitude', currentLocation.coords.longitude);
      } catch {
        setError('Could not fetch location. Please select it on the map.');
      } finally {
        setLoading(false);
      }
    };
    if (step === 3) getLocation();
  }, [step]);

  const handleFormChange = (field: keyof Omit<FormData, 'address'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  const handleAddressChange = (field: keyof Address, value: string | number) => {
    setFormData(prev => ({ ...prev, address: { ...prev.address, [field]: value } }));
  };

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
      let fDate = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`;
      handleFormChange('date_of_birth', fDate);
    }
  };

  const handleNextStep = () => {
    if (step === 1 && (!formData.email || !formData.password || !formData.first_name || !formData.last_name)) {
      setError('Please fill all required fields in Step 1.');
      return;
    }
    if (step === 2 && (!formData.license_number || !formData.years_of_experience || !formData.profile_picture_url)) {
      setError('Please provide your license number, years of experience, and a profile picture URL.');
      return;
    }
    setError('');
    setStep(s => s + 1);
  };

  const handleConfirmLocationAndGeocode = async () => {
    if (isGeocoding) return;
    setIsGeocoding(true);
    setError('');
    try {
      const { latitude, longitude } = formData.address;
      const geocodedAddresses = await Location.reverseGeocodeAsync({ latitude, longitude });

      if (geocodedAddresses && geocodedAddresses.length > 0) {
        const addr = geocodedAddresses[0];
        // Use a single state update for better performance
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            address_line_1: `${addr.streetNumber || ''} ${addr.street || ''}`.trim(),
            city: addr.city || '',
            state: addr.region || '',
            pincode: addr.postalCode || '',
            country: addr.country || prev.address.country,
          },
        }));
      } else {
        setError('Could not determine address. Please enter it manually.');
      }
    } catch (error) {
      console.error('Geocoding Error:', error);
      setError('Failed to fetch address details. Please enter them manually.');
    } finally {
      setIsGeocoding(false);
      setStep(4); // Move to the next step regardless of success
    }
  };

  const handleSignUp = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...formData,
        years_of_experience: parseInt(formData.years_of_experience, 10) || 0,
      };
      
      const response = await axios.post(`${data.apiUrl}/nurses/register`, payload);
      const { access_token, refresh_token } = response.data;
      await AsyncStorage.setItem('access_token', access_token);
      await AsyncStorage.setItem('refresh_token', refresh_token);
      Alert.alert('Success!', 'Your nurse profile has been created. Please sign in.', [
        { text: 'OK', onPress: () => router.push('/(tabs)') },
      ]);
    } catch (e: any) {
      const errorMessage = e.response?.data?.detail || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER STEPS WITH FADE/SLIDE ANIMATIONS ---
  const renderStepOne = () => (
    <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
      <Text style={styles.stepTitle}>Step 1: Personal Details</Text>
      <TextInput style={styles.input} placeholder="First Name" placeholderTextColor="#a0aec0" value={formData.first_name} onChangeText={v => handleFormChange('first_name', v)} />
      <TextInput style={styles.input} placeholder="Last Name" placeholderTextColor="#a0aec0" value={formData.last_name} onChangeText={v => handleFormChange('last_name', v)} />
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#a0aec0" value={formData.email} onChangeText={v => handleFormChange('email', v)} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#a0aec0" secureTextEntry value={formData.password} onChangeText={v => handleFormChange('password', v)} />
      <TextInput style={styles.input} placeholder="Phone" placeholderTextColor="#a0aec0" value={formData.phone_number} onChangeText={v => handleFormChange('phone_number', v)} keyboardType="phone-pad" />

      <Pressable onPress={() => setShowDatePicker(true)}>
        <View style={styles.input}>
          <Text style={formData.date_of_birth ? styles.dateText : styles.placeholderText}>
            {formData.date_of_birth || 'Date of Birth'}
          </Text>
        </View>
      </Pressable>
      {showDatePicker && <DateTimePicker value={date} mode="date" display="default" onChange={onChangeDate} />}

      <View style={styles.genderContainer}>
        {['Male', 'Female'].map(g => (
          <Pressable
            key={g}
            style={[styles.genderButton, formData.gender === g && styles.genderButtonSelected]}
            onPress={() => handleFormChange('gender', g)}
          >
            <Feather name="user" size={20} color={formData.gender === g ? '#192f6a' : '#fff'} style={styles.genderIcon} />
            <Text style={[styles.genderButtonText, formData.gender === g && styles.genderButtonTextSelected]}>{g}</Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );

  const renderStepTwo = () => (
    <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
      <Text style={styles.stepTitle}>Step 2: Professional Details</Text>
      <TextInput style={styles.input} placeholder="License Number" placeholderTextColor="#a0aec0" value={formData.license_number} onChangeText={v => handleFormChange('license_number', v)} />
      <TextInput style={styles.input} placeholder="Years of Experience" placeholderTextColor="#a0aec0" value={formData.years_of_experience} onChangeText={v => handleFormChange('years_of_experience', v)} keyboardType="number-pad" />
      <TextInput style={styles.input} placeholder="Profile Picture URL" placeholderTextColor="#a0aec0" value={formData.profile_picture_url} onChangeText={v => handleFormChange('profile_picture_url', v)} keyboardType="url" autoCapitalize="none" />
      <TextInput
        style={[styles.input, { height: 100, textAlignVertical: 'top', paddingTop: 15 }]}
        placeholder="Short Bio (Optional)" placeholderTextColor="#a0aec0" value={formData.bio} onChangeText={v => handleFormChange('bio', v)} multiline
      />
    </Animated.View>
  );

  const renderStepThree = () => (
    <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.mapStepContainer}>
      <Text style={styles.stepTitle}>Step 2: Pin Your Location</Text>
      <View style={styles.mapWrapper}>
        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <MapView
            style={styles.map}
            region={{
              latitude: formData.address.latitude,
              longitude: formData.address.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              draggable
              coordinate={{ latitude: formData.address.latitude, longitude: formData.address.longitude }}
              onDragEnd={e => {
                handleAddressChange('latitude', e.nativeEvent.coordinate.latitude);
                handleAddressChange('longitude', e.nativeEvent.coordinate.longitude);
              }}
            />
          </MapView>
        )}
      </View>
      <Pressable style={styles.confirmButton} onPress={handleConfirmLocationAndGeocode} disabled={isGeocoding}>
        {isGeocoding ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.confirmButtonText}>Confirm Location</Text>
        )}
      </Pressable>
    </Animated.View>
  );

  const renderStepFour = () => (
    <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
      <Text style={styles.stepTitle}>Step 3: Confirm Address</Text>
      <TextInput style={styles.input} placeholder="Address Line 1" placeholderTextColor="#a0aec0" value={formData.address.address_line_1} onChangeText={v => handleAddressChange('address_line_1', v)} />
      <TextInput style={styles.input} placeholder="City" placeholderTextColor="#a0aec0" value={formData.address.city} onChangeText={v => handleAddressChange('city', v)} />
      <TextInput style={styles.input} placeholder="State" placeholderTextColor="#a0aec0" value={formData.address.state} onChangeText={v => handleAddressChange('state', v)} />
      <TextInput style={styles.input} placeholder="Pincode" placeholderTextColor="#a0aec0" value={formData.address.pincode} onChangeText={v => handleAddressChange('pincode', v)} keyboardType="number-pad" />
    </Animated.View>
  );

  return (
    <LinearGradient
  colors={['#1a1a1a', '#000000']}
      style={styles.gradientBackground}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Create Account</Text>

            {step === 1 && renderStepOne()}
            {step === 2 && renderStepTwo()}
            {step === 3 && renderStepThree()}
            {step === 4 && renderStepFour()}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
              {step < 4 ? (
                <Pressable
                  style={styles.actionButton}
                  onPress={handleNextStep}
                  onPressIn={handleButtonPressIn}
                  onPressOut={handleButtonPressOut}
                >
                  <Text style={styles.actionButtonText}>Next</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={styles.actionButton}
                  onPress={handleSignUp}
                  disabled={loading}
                  onPressIn={handleButtonPressIn}
                  onPressOut={handleButtonPressOut}
                >
                  {loading ? <ActivityIndicator color="#192f6a" /> : <Text style={styles.actionButtonText}>Sign Up</Text>}
                </Pressable>
              )}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientBackground: { flex: 1 },

  safeArea: { 
    flex: 1, 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
  },

  scrollContainer: { 
    flexGrow: 1, 
    paddingHorizontal: 24, 
    paddingBottom: 40, 
    justifyContent: 'center' 
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F7FAFC', // brighter white for black bg
    textAlign: 'center',
    marginBottom: 30,
  },

  stepTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#E2E8F0', // light grayish white
    marginBottom: 20,
    textAlign: 'center',
  },

  input: {
    height: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.08)', // more subtle on black
    borderRadius: 14,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 15,
    justifyContent: 'center',
  },

  placeholderText: { fontSize: 16, color: '#A0AEC0' }, 
  dateText: { fontSize: 16, color: '#E2E8F0' },

  errorText: {
    color: '#FC8181', // brighter red on black
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 14,
  },

  buttonContainer: { marginTop: 20 },

  actionButton: {
    backgroundColor: '#4c8bf5',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  actionButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },

  genderContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },

  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    marginHorizontal: 5,
  },
  genderButtonSelected: { backgroundColor: '#4c8bf5' }, // deeper purple
  genderIcon: { marginRight: 10 },
  genderButtonText: { fontSize: 16, color: '#E2E8F0', fontWeight: '500' },
  genderButtonTextSelected: { color: '#FFFFFF' },

  mapStepContainer: { flex: 1, minHeight: 500 },

  mapWrapper: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  map: { ...StyleSheet.absoluteFillObject },

  confirmButton: {
    backgroundColor: '#4FD1C5',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});
