import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppHeader from '@/components/AppHeader';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import PostMediaCarousel from '@/components/PostMediaCarousel';
import ShareSheet from '@/components/ShareSheet';
import { colors } from '@/constants/theme';
import { ApiConversation, ApiMessage, ApiPost, getConversationMessages, getConversations, getNewsFeed, sendMessage } from '@/lib/api';
import { useLocalSearchParams } from 'expo-router';
import { getCurrentUser } from '@/lib/session';

type Tab = 'direct' | 'groups' | 'posts';

const quickEmojis = ['😀', '😂', '😍', '🔥', '🙏', '❤️'];

export default function CommunityScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ compose?: 'user' | 'group'; recipientId?: string; title?: string }>();
  const [tab, setTab] = useState<Tab>('direct');
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [conversationPage, setConversationPage] = useState(1);
  const [conversationLastPage, setConversationLastPage] = useState(1);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [postPage, setPostPage] = useState(1);
  const [postLastPage, setPostLastPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [activeConversation, setActiveConversation] = useState<ApiConversation | null>(null);

  useEffect(() => {
    loadConversations(1, true);
    loadPosts(1, true);
  }, []);

  useEffect(() => {
    if (!params.compose || !params.recipientId) return;
    setActiveConversation({ key: `${params.compose}:${params.recipientId}`, kind: params.compose, title: params.title ?? '', subtitle: '', peerUserId: params.compose === 'user' ? params.recipientId : undefined, groupId: params.compose === 'group' ? params.recipientId : undefined, unreadCount: 0 });
  }, [params.compose, params.recipientId, params.title]);

  const loadConversations = (nextPage: number, reset = false) => {
    if (loading || (!reset && nextPage > conversationLastPage)) return;
    setLoading(true);
    getConversations(nextPage)
      .then((result) => {
        setConversations((current) => reset ? result.items : [...current, ...result.items]);
        setConversationPage(nextPage);
        setConversationLastPage(result.lastPage);
      })
      .catch(() => {
        if (reset) setConversations([]);
      })
      .finally(() => setLoading(false));
  };

  const loadPosts = (nextPage: number, reset = false) => {
    if (loading || (!reset && nextPage > postLastPage)) return;
    setLoading(true);
    getNewsFeed(nextPage)
      .then((result) => {
        setPosts((current) => reset ? result.items : [...current, ...result.items]);
        setPostPage(nextPage);
        setPostLastPage(result.lastPage);
      })
      .catch(() => {
        if (reset) setPosts([]);
      })
      .finally(() => setLoading(false));
  };

  const visibleConversations = conversations.filter((item) => tab === 'groups' ? item.kind === 'group' : item.kind === 'user');

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title={t('community')} />
      <View style={styles.tabs}>
        <TabButton label={t('discussions')} active={tab === 'direct'} onPress={() => setTab('direct')} />
        <TabButton label={t('groups')} active={tab === 'groups'} onPress={() => setTab('groups')} />
        <TabButton label={t('publications')} active={tab === 'posts'} onPress={() => setTab('posts')} />
      </View>

      {tab === 'posts' ? (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <PostCard post={item} />}
          ListEmptyComponent={loading ? <LoadingState /> : <EmptyState title={t('noContentTitle')} body={t('noPosts')} />}
          ListFooterComponent={loading && posts.length ? <LoadingState compact /> : null}
          onEndReached={() => loadPosts(postPage + 1)}
          onEndReachedThreshold={0.4}
        />
      ) : (
        <FlatList
          data={visibleConversations}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <ConversationRow conversation={item} onPress={() => setActiveConversation(item)} />}
          ListEmptyComponent={loading ? <LoadingState /> : <EmptyState title={t('messages')} body={t('noMessagesBody')} />}
          ListFooterComponent={loading && visibleConversations.length ? <LoadingState compact /> : null}
          onEndReached={() => loadConversations(conversationPage + 1)}
          onEndReachedThreshold={0.4}
        />
      )}

      <ConversationModal conversation={activeConversation} onClose={() => setActiveConversation(null)} />
    </SafeAreaView>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.tab, active && styles.activeTab]} onPress={onPress}>
      <Text style={styles.tabText}>{label}</Text>
    </Pressable>
  );
}

function ConversationRow({ conversation, onPress }: { conversation: ApiConversation; onPress: () => void }) {
  return (
    <Pressable style={styles.thread} onPress={onPress}>
      {conversation.avatarUrl ? <Image source={{ uri: conversation.avatarUrl }} style={styles.threadAvatar} /> : <View style={styles.threadAvatar}><Text style={styles.threadInitial}>{conversation.title.charAt(0)}</Text></View>}
      <View style={styles.threadBody}>
        <Text style={styles.threadTitle}>{conversation.title}</Text>
        <Text style={styles.threadSubtitle} numberOfLines={1}>{conversation.subtitle}</Text>
      </View>
      <View style={styles.threadMeta}>
        {!!conversation.unreadCount && <Text style={styles.badge}>{conversation.unreadCount}</Text>}
        <Text style={styles.time}>{conversation.time}</Text>
      </View>
    </Pressable>
  );
}

function ConversationModal({ conversation, onClose }: { conversation: ApiConversation | null; onClose: () => void }) {
  const { t } = useTranslation();
  const user = getCurrentUser();
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<ApiMessage[]>([]);

  useEffect(() => {
    setMessages(conversation?.lastMessage ? [conversation.lastMessage] : []);
    setText('');
    if (conversation) getConversationMessages(conversation).then(setMessages).catch(() => undefined);
  }, [conversation]);

  const send = async () => {
    const content = text.trim();
    if (!conversation || !content) return;

    setText('');
    const optimistic: ApiMessage = {
      id: `${Date.now()}`,
      content,
      type: 'text',
      status: 'unread',
      userId: user.id,
      addresseeUserId: conversation.peerUserId,
      addresseeGroupId: conversation.groupId,
    };
    setMessages((items) => [...items, optimistic]);

    try {
      const saved = await sendMessage({ content, addresseeUserId: conversation.peerUserId, addresseeGroupId: conversation.groupId });
      setMessages((items) => items.map((item) => item.id === optimistic.id ? saved : item));
    } catch (error) {
      Alert.alert(t('messages'), error instanceof Error ? error.message : t('loginFallbackError'));
    }
  };

  return (
    <Modal visible={!!conversation} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.chatHeader}>
            <Pressable onPress={onClose}><Feather name="arrow-left" size={23} color={colors.text} /></Pressable>
            <Text style={styles.chatTitle} numberOfLines={1}>{conversation?.title}</Text>
            <View style={styles.callButtons}>
              <Pressable onPress={() => Alert.alert(t('comingSoonTitle'), t('callComingSoon'))}><Feather name="phone" size={19} color={colors.text} /></Pressable>
              <Pressable onPress={() => Alert.alert(t('comingSoonTitle'), t('callComingSoon'))}><Feather name="video" size={20} color={colors.text} /></Pressable>
            </View>
          </View>

          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            renderItem={({ item }) => {
              const mine = item.userId === user.id;
              return (
                <View style={[styles.messageBubble, mine && styles.mineBubble]}>
                  <Text style={styles.messageText}>{item.content}</Text>
                  <Feather name={item.status === 'read' ? 'check-circle' : 'circle'} size={12} color={colors.muted} style={styles.readIcon} />
                </View>
              );
            }}
          />

          <View style={styles.composer}>
            <Pressable onPress={() => setText((value) => `${value}${quickEmojis[0]}`)}><Feather name="smile" size={22} color={colors.text} /></Pressable>
            <TextInput value={text} onChangeText={setText} placeholder={t('writeMessage')} placeholderTextColor={colors.muted} style={styles.input} multiline autoFocus />
            <Pressable onPress={() => Alert.alert(t('comingSoonTitle'), t('voiceComingSoon'))}><Feather name="mic" size={21} color={colors.text} /></Pressable>
            <Pressable style={styles.send} onPress={send}><Feather name="send" size={17} color={colors.text} /></Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function PostCard({ post }: { post: ApiPost }) {
  const [shareVisible, setShareVisible] = useState(false);
  const mediaFiles = post.files.length ? post.files : post.image ? [{ id: `${post.id}-image`, url: post.image, type: 'photo' }] : [];

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        {post.avatarUrl ? <Image source={{ uri: post.avatarUrl }} style={styles.avatar} /> : <View style={styles.avatar}><Text style={styles.threadInitial}>{post.author.charAt(0)}</Text></View>}
        <View style={styles.threadBody}>
          <Text style={styles.threadTitle}>{post.author}</Text>
          <Text style={styles.threadSubtitle}>@{post.username}</Text>
        </View>
      </View>
      <Text style={styles.postBody}>{post.body}</Text>
      {!!mediaFiles.length && <PostMediaCarousel files={mediaFiles} />}
      <View style={styles.threadActions}>
        <Text style={styles.actionText}>{post.comments ?? 0} commentaires</Text>
        <Text style={styles.actionText}>{post.shares ?? 0} partages</Text>
        <Pressable onPress={() => setShareVisible(true)}><FontAwesome name="share" size={16} color={colors.muted} /></Pressable>
      </View>
      <ShareSheet visible={shareVisible} entity="post" entityId={post.id} onClose={() => setShareVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  tab: { flex: 1, borderRadius: 8, paddingVertical: 10, backgroundColor: colors.panel },
  activeTab: { backgroundColor: colors.primary },
  tabText: { color: colors.text, textAlign: 'center', fontSize: 12, fontWeight: '800' },
  list: { padding: 16, paddingTop: 4, paddingBottom: 96 },
  thread: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 8, padding: 12, marginBottom: 10, backgroundColor: colors.panel },
  threadAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight },
  threadInitial: { color: colors.text, fontWeight: '900' },
  threadBody: { flex: 1 },
  threadTitle: { color: colors.text, fontWeight: '900' },
  threadSubtitle: { color: colors.muted, fontSize: 12, marginTop: 3 },
  threadMeta: { alignItems: 'flex-end', gap: 5 },
  badge: { color: colors.text, backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, fontWeight: '900', overflow: 'hidden' },
  time: { color: colors.muted, fontSize: 11 },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  chatTitle: { flex: 1, color: colors.text, fontSize: 17, fontWeight: '900' },
  callButtons: { flexDirection: 'row', gap: 16 },
  messagesList: { padding: 16, gap: 10 },
  messageBubble: { alignSelf: 'flex-start', maxWidth: '82%', borderRadius: 8, padding: 12, backgroundColor: colors.panel },
  mineBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  messageText: { color: colors.text, lineHeight: 20 },
  readIcon: { alignSelf: 'flex-end', marginTop: 4 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 14, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, minHeight: 44, maxHeight: 120, color: colors.text, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.panel },
  send: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  postCard: { borderRadius: 8, padding: 14, marginBottom: 12, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight },
  postBody: { color: colors.text, lineHeight: 21, marginTop: 12 },
  threadActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  actionText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
});
