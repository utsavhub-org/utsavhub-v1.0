import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { X, Volume2, VolumeX, Play, MessageCircle, MapPin, Sparkles } from 'lucide-react-native';
import { MediaReel, Business } from '../types';
import { THEME } from '../theme/colors';

interface ReelModalProps {
  visible: boolean;
  reel: MediaReel | null;
  business?: Business | null;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ReelModal({
  visible,
  reel,
  business,
  onClose,
}: ReelModalProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  if (!reel) return null;

  const togglePlay = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await videoRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const toggleMute = async () => {
    if (!videoRef.current) return;
    await videoRef.current.setIsMutedAsync(!isMuted);
    setIsMuted(!isMuted);
  };

  const handleWhatsApp = () => {
    if (!business) return;
    const cleanNum = business.whatsapp_number.replace(/\D/g, '');
    const url = `whatsapp://send?phone=${cleanNum}&text=Hi%2C%20I%20saw%20your%20reel%20on%20UtsavHub%20(${encodeURIComponent(reel.title)})`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://wa.me/${cleanNum}`);
    });
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Top Controls */}
          <View style={styles.topBar}>
            <View style={styles.reelTag}>
              <Sparkles size={12} color="#D4AF37" />
              <Text style={styles.reelTagText}>Short Reel Walkthrough</Text>
            </View>
            <View style={styles.topRightControls}>
              <TouchableOpacity
                style={styles.iconCircle}
                onPress={toggleMute}
                activeOpacity={0.7}
              >
                {isMuted ? (
                  <VolumeX size={18} color="#FFFFFF" />
                ) : (
                  <Volume2 size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconCircle}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <X size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Video Player */}
          <TouchableOpacity
            style={styles.videoWrapper}
            onPress={togglePlay}
            activeOpacity={1}
          >
            <Video
              ref={videoRef}
              source={{ uri: reel.video_url }}
              style={styles.video}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted={isMuted}
            />

            {!isPlaying && (
              <View style={styles.playOverlay}>
                <View style={styles.playButton}>
                  <Play size={28} color="#FFFFFF" style={{ marginLeft: 3 }} />
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* Bottom Reel Metadata */}
          <View style={styles.bottomMeta}>
            <Text style={styles.reelTitle} numberOfLines={2}>
              {reel.title}
            </Text>

            {business && (
              <View style={styles.businessRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bizName}>{business.name}</Text>
                  <View style={styles.locRow}>
                    <MapPin size={11} color="#D4AF37" />
                    <Text style={styles.locText}>
                      {business.area_locality}, {business.city}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.waButton}
                  onPress={handleWhatsApp}
                  activeOpacity={0.8}
                >
                  <MessageCircle size={14} color="#FFFFFF" />
                  <Text style={styles.waButtonText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    height: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: '#0F172A',
    justifyContent: 'space-between',
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 25,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  reelTagText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.colors.burgundy,
    borderWidth: 1.5,
    borderColor: THEME.colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  bottomMeta: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  reelTitle: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
    marginBottom: 8,
  },
  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  bizName: {
    color: '#FDE68A',
    fontSize: 14,
    fontWeight: '700',
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  locText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  waButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  waButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
