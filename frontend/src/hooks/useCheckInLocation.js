import { useState } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import toast from 'react-hot-toast';

export function useCheckInLocation(checkInId) {
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('');

  const updateLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setUpdatingLocation(true);
    toast.loading('Getting your location...', { id: 'location-update' });

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });
      });

      const { latitude, longitude, accuracy } = position.coords;

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      let locationName = `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      if (data.results && data.results.length > 0) {
        locationName = data.results[0].formatted_address;
      }

      await updateDoc(doc(db, 'checkins', checkInId), {
        location: locationName,
        gpsCoords: { lat: latitude, lng: longitude },
        locationAccuracy: accuracy,
        locationUpdatedAt: Timestamp.now(),
      });

      setCurrentLocation(locationName);
      toast.dismiss('location-update');
      toast.success(`Location updated! (±${Math.round(accuracy)}m accuracy)`);
      setUpdatingLocation(false);
    } catch (error) {
      console.error('Error updating location:', error);
      toast.dismiss('location-update');
      
      if (error.code === 1) {
        toast.error('Location permission denied. Please enable location access in your browser settings.', { 
          duration: 6000,
          icon: '📍',
        });
        
        setTimeout(async () => {
          try {
            const permission = await navigator.permissions.query({ name: 'geolocation' });
            if (permission.state === 'prompt') {
              toast.loading('Requesting location permission...', { id: 'location-perm-card' });
              navigator.geolocation.getCurrentPosition(
                () => {
                  toast.dismiss('location-perm-card');
                  toast.success('Location permission granted!');
                  updateLocation();
                },
                () => {
                  toast.dismiss('location-perm-card');
                  toast.error('Please enable location in your browser settings: Settings → Privacy → Location', { duration: 6000 });
                },
                { enableHighAccuracy: true, timeout: 5000 }
              );
            }
          } catch (permError) {
            console.log('Permissions API not supported');
          }
        }, 2000);
      } else if (error.code === 2) {
        toast.error('Location unavailable. Make sure GPS/Location Services are enabled on your device.', { duration: 5000 });
      } else if (error.code === 3) {
        toast.error('Location timeout. Please move to an area with better GPS signal and try again.', { duration: 5000 });
      } else {
        toast.error('Failed to update location. Please try again.');
      }
      setUpdatingLocation(false);
    }
  };

  return { currentLocation, setCurrentLocation, updatingLocation, updateLocation };
}

