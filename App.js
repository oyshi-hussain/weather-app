import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TextInput, Button, ImageBackground, ScrollView, Image } from 'react-native';
import axios from "axios";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import backgroundImage from './assets/weatherAppBackground.jpg';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

const API_KEY = "01fbb54a548f4d588c42ab8498d834f1";

export default function App() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState(''); // User Input for search bar
  const [currentCity, setCurrentCity] = useState('Toronto'); // Fetching the actual city
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [dailyForecast, setDailyForecast] = useState([]);
  const [coords, setCoords] = useState({ latitude: 43.65107, longitude: -79.347015 }); // Deafult Toronto's weather
  const [timezone, setTimezone] = useState('auto');


  
  // // Weather Icons for Open-Meteo
  const weatherIcons = {
    // Clear sky
    0: require('./assets/weatherIcons/sun.png'),       // Default day version
    '0-night': require('./assets/weatherIcons/moon.png'),
  
    // Mainly clear, partly cloudy, and overcast
    1: require('./assets/weatherIcons/partly_cloudy.png'),
    2: require('./assets/weatherIcons/clouds.png'),
    3: require('./assets/weatherIcons/overcast.png'),
  
    // Fog and depositing rime fog
    45: require('./assets/weatherIcons/fog.png'),
    48: require('./assets/weatherIcons/fog.png'),
  
    // Drizzle
    51: require('./assets/weatherIcons/drizzle.png'),
    53: require('./assets/weatherIcons/drizzle.png'),
    55: require('./assets/weatherIcons/drizzle.png'),
  
    // Rain
    61: require('./assets/weatherIcons/rain.png'),
    63: require('./assets/weatherIcons/rain.png'),
    65: require('./assets/weatherIcons/rain.png'),
  
    // Snow
    71: require('./assets/weatherIcons/snow.png'),
    73: require('./assets/weatherIcons/snow.png'),
    75: require('./assets/weatherIcons/snow.png'),
  
    // Snow Grains
    77: require('./assets/weatherIcons/snow_grains.png'),
  
    // Rain showers
    80: require('./assets/weatherIcons/rain_shower.png'),
    81: require('./assets/weatherIcons/rain_shower.png'),
    82: require('./assets/weatherIcons/rain_shower.png'),
  
    // Snow showers
    85: require('./assets/weatherIcons/snow_shower.png'),
    86: require('./assets/weatherIcons/snow_shower.png'),
  
    // Thunderstorms
    95: require('./assets/weatherIcons/thunder.png'),
    96: require('./assets/weatherIcons/thunder.png'),
    99: require('./assets/weatherIcons/thunder.png'),
  };
  


  // Getting the current weather
  const fetchWeather = async (latitude, longitude, timezone) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,relative_humidity_2m,is_day,apparent_temperature,rain&timezone=${timezone}`
      );
      setWeather(res.data.current);
      // await fetchHourlyForecast(latitude, longitude, timezone);
      // await fetchDailyForecast(latitude, longitude, timezone);
    } catch (err) {
      console.error('Failed to fetch current weather', err);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };
  
  

  // Hourly weather from Open-Meteo
  const fetchHourlyForecast = async (latitude, longitude, timezone) => {
    try {
      const weatherRes = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weather_code&timezone=${timezone}`
      );      
  
      const now = new Date();
      const nextSeven = [];
  
      for (let i = 0; i < weatherRes.data.hourly.time.length; i++) {
        const forecastTime = new Date(weatherRes.data.hourly.time[i]);
        if (forecastTime > now) {
          const hour24 = forecastTime.getHours();
          const isDay = hour24 >= 6 && hour24 < 18;
          const code = weatherRes.data.hourly.weather_code[i];
          const iconKey = code === 0 ? (isDay ? '0' : '0-night') : code;
  
          nextSeven.push({
            time: forecastTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            temp: weatherRes.data.hourly.temperature_2m[i],
            iconKey,
          });
  
          if (nextSeven.length === 7) break;
        }
      }
  
      setHourlyForecast(nextSeven);
    } catch (err) {
      console.error("City geocoding failed", err);
      setHourlyForecast([]);
    }
  };



  // Getting the next 7 days forecast
  const fetchDailyForecast = async (latitude, longitude, timezone) => {
    try {
      const res = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=${timezone}`
      );

      const daily = res.data.daily;
      const nextSevenDays = [];

      for (let i = 0; i < daily.time.length; i++) {
        nextSevenDays.push ({
          date: daily.time[i],
          minTemp: daily.temperature_2m_min[i],
          maxTemp: daily.temperature_2m_max[i],
          code: daily.weather_code[i],
        });
      }

      setDailyForecast(nextSevenDays);
    } catch (err) {
      console.error("7-day forecast fetch failed", err);
    }
  };
  
  

  const getLocationWeather = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permission to access location was denied');
        return;
      }
  
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
  
      const geoRes = await axios.get(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`
      );
  
      const cityName = geoRes.data[0]?.name || 'Toronto';
      setCurrentCity(cityName);
      setCoords({ latitude, longitude });
      setTimezone("auto");
      // fetchWeather(latitude, longitude, timezone);
      // fetchHourlyForecast(latitude, longitude, timezone);
      // fetchDailyForecast(latitude, longitude, timezone)
    } catch (error) {
      console.error("Error getting current location:", error);
    }
  };
  

  

  
  // The weather being updated
  useEffect(() => {
    const updateWeather = async () => {
      try {
        const { latitude, longitude } = coords;

        await fetchWeather(latitude, longitude, timezone);         
        await fetchHourlyForecast(latitude, longitude, timezone);
        await fetchDailyForecast(latitude, longitude, timezone);

      } catch (err) {
        console.error("City geocoding failed", err);
      }
    };
  
    updateWeather();
  }, [coords, timezone]);
  
  

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!weather) {
    return (
      <View style={styles.container}>
        <Text>Failed to Load Weather . . .</Text>
      </View>
    );
  }



  // Displaying all the weather
  return (
    <>
    <ImageBackground source={backgroundImage} style={styles.backgroundImage}>
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
    <View style={{ alignItems: 'center' }}>
      {/* Search Bar */}
      <LinearGradient
      colors={['#2E335A', '#1C1B33']}
      style={styles.gradient}
      >
        <TextInput
          style={styles.input}
          placeholder="Enter City Name" placeholderTextColor='grey'
          value={city}
          onChangeText={async (text) => {
            setCity(text);
            if (text.length > 2) {
              try {
                const res = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${text}&count=5`);
                setSuggestions(res.data.results || []);
              } catch (err) {
                console.error('Suggestion fetch failed', err);
              }
            } else {
              setSuggestions([]);
            }
          }}
        />
        {suggestions.length > 0 && (
          <View style={{ backgroundColor: '#fff', padding: 10, borderRadius: 10 }}>
            {suggestions.map((sug, index) => (
              <Text
              key={index}
              onPress={async () => {
                try {
                  const res = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${sug.name}&count=1`);
                  const { latitude, longitude, timezone } = res.data.results[0];
                  const cityFull = `${sug.name}, ${sug.country_code}`;
                  setCoords({ latitude, longitude });
                  setCurrentCity(cityFull);
                  setTimezone(timezone || "auto");
                  await fetchWeather(latitude, longitude, timezone);
                  await fetchHourlyForecast(latitude, longitude, timezone);
                  await fetchDailyForecast(latitude, longitude, timezone);
                  setCity('');
                  setSuggestions([]);
                } catch (err) {
                  console.error("Suggestion select failed", err);
                }
              }}
              style={{ paddingVertical: 5, fontWeight: 'bold' }}
            >
              {sug.name}, {sug.country_code}
            </Text>
            
            ))}
          </View>
        )}
        <Button
          title="🔍"
          onPress={async () => {
            if (city.trim() !== '') {
              try {
                const geoRes = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`);
                const { latitude, longitude, name, country_code, timezone } = geoRes.data.results[0];
                // const fullCity = `${name}, ${country_code}`;
                setCoords({ latitude, longitude });
                setCurrentCity(name);
                setTimezone(timezone || "auto");

                // await fetchWeather(latitude, longitude, timezone);
                // await fetchHourlyForecast(latitude, longitude, timezone);
                // await fetchDailyForecast(latitude, longitude, timezone);
              } catch (err) {
                console.error("City search failed", err);
              }
            }
          }}
        />
        <Ionicons
          name='location-outline'
          size={24}
          color='white'
          style={{ marginLeft: 10 }}
          onPress={getLocationWeather}
          />
          
      </LinearGradient>



      {/* Weather Info */}
      <BlurView intensity={50} tint="light" style={styles.glassCard}>
      <View style={styles.weatherBox}>
      <Text style={styles.info}>Showing weather for: {currentCity}</Text>
      <Text style={styles.city}>{currentCity}</Text>
      <Text style={styles.temp}>{Math.round(weather.temperature_2m)}°C</Text>
      <Text style={styles.desc}>Feels like: {Math.round(weather.apparent_temperature)}°C</Text>

      </View>
      </BlurView>
      


    {/* Weather for the next 7 hours */}
    <ScrollView
     horizontal 
     nestedScrollEnabled={true}
     showsHorizontalScrollIndicator={false} 
     style={styles.hourlyScroll}>
        {hourlyForecast.map((hour, index) => (
          <View key={index} style={styles.hourCard}>
            <Text style={styles.hourText}>{hour.time}</Text>
            <Image
              source={weatherIcons[hour.iconKey] || weatherIcons[0]}
              style={{ width: 40, height: 40 }}
            />
            <Text style={styles.tempText}>{Math.round(hour.temp)}°C</Text>
          </View>
        ))}
      </ScrollView>
      </View>
    
    
      {/* 7 day weather */}
      <View style={styles.daysCard}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 20 }}>Next 7 Days</Text>
        {dailyForecast.map((day, index) => (
          <View key={index} style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            marginVertical: 6, 
           }}>
            <Text style={{ color: 'white', width: 60, fontSize: 18 }}>{new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}</Text>
            <Text style={{ color: 'white', fontSize: 18}}>
              {Math.round(day.minTemp)}° / {Math.round(day.maxTemp)}°
            </Text>
          </View>
        ))}
      </View>
      
      </ScrollView>
    </ImageBackground>
    </>

  );
}

// ✅ Styles
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingTop: 60,
    paddingBottom: 60,
    // backgroundColor: '#FFF2CF',
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1B33',
    borderWidth: 1,
    borderColor: "#1C1B33",
    borderRadius: 30,
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: 0.1,
    shadowRadius: 3,
    opacity: 0.8,
  },

  input: {
    height: 50,
    borderColor: "#aaa",
    paddingHorizontal: 10,
    width: 180,
    borderRadius: 10,
    marginRight: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  weatherBox: {
    alignItems: 'center',
    padding: 60,
    // backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 30,
    color: 'white',
  },
  
  glassCard: {
    borderRadius: 30,
    overflow: 'hidden',
    marginVertical: 20,
    width: '90%',
  },
  
  city: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  temp: {
    fontSize: 48,
    marginVertical: 10,
    color: 'white',
    opacity: 0.7,
  },
  desc: {
    fontSize: 20,
    fontStyle: 'italic',
    color: 'white',
    opacity: 0.7,
  },
  info: {
    fontSize: 16,
    marginBottom: 30,
    color: '#444',
  },

  // For the 7 hours forecast
  
  hourlyScroll: {
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  hourCard: {
    alignItems: 'center',
    marginHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 10,
    width: 90,
    height: 120,
    justifyContent: 'space-between',
    marginTop: '30',
    marginBottom: '30',
  },
  hourText: {
    fontSize: 14,
    color: '#fff',
  },
  tempText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },

  daysCard: {
    marginHorizontal: 20,
    // backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  }
});
