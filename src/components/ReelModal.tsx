import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
  Platform,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  X,
  Volume2,
  VolumeX,
  Play,
  MessageCircle,
  MapPin,
  Sparkles,
  Send,
  MessageSquare,
} from 'lucide-react-native';
import { MediaReel, Business, ReelComment } from '../types';
import { THEME } from '../theme/colors';
import { getReelComments, addReelComment } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

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
  const { currentUser } = useAuth();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Reel Comments State
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<ReelComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  const player = useVideoPlayer(reel?.video_url || '', (p) => {
    p.loop = true;
    p.play();
  });

  useEffect(() => {
    if (visible && reel) {
      getReelComments(reel.id).then((data) => setComments(data));
    }
  }, [visible, reel]);

  if (!reel) return null;

  const togglePlay = () => {
    if (player.playing) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    player.muted = !player.muted;
    setIsMuted(player.muted);
  };

  const handleWhatsApp = () => {
    if (!business) return;
    const cleanNum = business.whatsapp_number.replace(/\D/g, '');
    const url = `whatsapp://send?phone=${cleanNum}&text=Hi%2C%20I%20saw%20your%20reel%20on%20UtsavHub%20(${encodeURIComponent(reel.title)})`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://wa.me/${cleanNum}`);
    });
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !reel) return;
    setIsPostingComment(true);
    const posted = await addReelComment({
      reel_id: reel.id,
      user_id: currentUser?.id || 'guest-user',
      user_name: currentUser?.name || 'Wedding Guest',
      user_avatar: currentUser?.avatar_url,
      comment_text: newComment.trim(),
    });

    setIsPostingComment(false);
    if (posted) {
      setComments((prev) => [posted, ...prev]);
      setNewComment('');
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
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
            <VideoView
              style={styles.video}
              player={player}
              contentFit="cover"
              nativeControls={false}
            />

            {!isPlaying && (
              <View style={styles.playOverlay}>
                <View style={styles.playButton}>
                  <Play size={28} color="#FFFFFF" style={{ marginLeft: 3 }} />
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* Right Floating Actions (Comments & Share) */}
          <View style={styles.floatingActions}>
            <TouchableOpacity
              style={styles.floatingActionBtn}
              onPress={() => setShowComments(!showComments)}
              activeOpacity={0.8}
            >
              <MessageSquare size={20} color="#FFFFFF" />
              <Text style={styles.floatingActionCount}>{comments.length}</Text>
            </TouchableOpacity>
          </View>

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

          {/* Comments Bottom Drawer */}
          {showComments && (
            <View style={styles.commentsDrawer}>
              <View style={styles.commentsHeader}>
                <Text style={styles.commentsTitle}>Reel Comments ({comments.length})</Text>
                <TouchableOpacity onPress={() => setShowComments(false)}>
                  <X size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.commentsList}
                showsVerticalScrollIndicator={false}
              >
                {comments.length === 0 ? (
                  <Text style={styles.noCommentsText}>
                    No comments yet. Be the first to share your thoughts on this hall!
                  </Text>
                ) : (
                  comments.map((c) => (
                    <View key={c.id} style={styles.commentRow}>
                      <View style={styles.commentAvatarCircle}>
                        <Text style={styles.commentAvatarLetter}>
                          {(c.user_name || 'U')[0].toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.commentAuthor}>{c.user_name}</Text>
                        <Text style={styles.commentBody}>{c.comment_text}</Text>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>

              {/* Add Comment Input */}
              <View style={styles.commentInputRow}>
                <TextInput
                  style={styles.commentInput}
                  value={newComment}
                  onChangeText={setNewComment}
                  placeholder="Add a comment..."
                  placeholderTextColor="#94A3B8"
                />
                <TouchableOpacity
                  style={styles.commentSendBtn}
                  onPress={handlePostComment}
                  disabled={isPostingComment || !newComment.trim()}
                >
                  {isPostingComment ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Send size={15} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
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
    ...StyleSheet.absoluteFill,
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
  floatingActions: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    alignItems: 'center',
    gap: 16,
    zIndex: 15,
  },
  floatingActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingActionCount: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  commentsDrawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '52%',
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    zIndex: 25,
    padding: 16,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  commentsTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  commentsList: {
    flex: 1,
  },
  noCommentsText: {
    color: '#94A3B8',
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  commentAvatarCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: THEME.colors.goldDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarLetter: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  commentAuthor: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  commentBody: {
    color: '#E2E8F0',
    fontSize: 12,
    lineHeight: 16,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 12.5,
  },
  commentSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.goldDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
