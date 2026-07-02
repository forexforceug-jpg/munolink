import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SendMoney({ navigation }) {
  const [amount, setAmount] = useState('25,000');
  const [note, setNote] = useState('');
  const [sendOption, setSendOption] = useState('instant');
  const [selectedContact, setSelectedContact] = useState(null);

  const quickAmounts = ['5,000', '10,000', '25,000', '50,000'];

  const recentRecipients = [
    { name: 'David O.', phone: '0772 345 678' },
    { name: 'Sarah K.', phone: '0751 234 567' },
    { name: 'Grace N.', phone: '0789 123 456' },
    { name: 'Peter M.', phone: '0701 987 654' },
    { name: 'Aisha L.', phone: '0765 432 109' },
  ];

  const contacts = [
    { id: 1, name: 'David Okello', phone: '+256 772 345 678' },
    { id: 2, name: 'Sarah Kiwanuka', phone: '+256 751 234 567' },
    { id: 3, name: 'Grace Nakamya', phone: '+256 789 123 456' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <View>
            <Text style={styles.logo}>MUNOLINK</Text>
            <Text style={styles.tagline}>Your partner, linked.</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color="#212121" />
            <View style={styles.notifBadge} />
          </TouchableOpacity>
          <TouchableOpacity>
            <View style={styles.profilePic}>
              <Ionicons name="person" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Row */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.pageTitle}>Send Money</Text>
            <Text style={styles.pageSubtitle}>Send money instantly to anyone on Munolink.</Text>
          </View>
          <TouchableOpacity style={styles.howBtn}>
            <Ionicons name="help-circle-outline" size={16} color="#006B3F" />
            <Text style={styles.howText}>How it works</Text>
          </TouchableOpacity>
        </View>

        {/* Step 1: Select Recipient */}
        <Text style={styles.stepTitle}>1. Select Recipient</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#888" />
            <TextInput style={styles.searchInput} placeholder="Search name or phone number" placeholderTextColor="#CCCCCC" />
          </View>
          <TouchableOpacity style={styles.contactBtn}>
            <Ionicons name="people-outline" size={20} color="#006B3F" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.qrBtn}>
            <Ionicons name="qr-code-outline" size={20} color="#006B3F" />
          </TouchableOpacity>
        </View>

        {/* Selected Contact Card */}
        {selectedContact ? (
          <View style={styles.selectedCard}>
            <View style={styles.selectedLeft}>
              <View style={styles.selectedAvatar}>
                <Ionicons name="person" size={24} color="#006B3F" />
              </View>
              <View>
                <Text style={styles.selectedName}>{selectedContact.name}</Text>
                <Text style={styles.selectedPhone}>{selectedContact.phone}</Text>
              </View>
            </View>
            <View style={styles.userBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#006B3F" />
              <Text style={styles.userBadgeText}>Munolink User</Text>
            </View>
          </View>
        ) : (
          <View style={styles.selectedCard}>
            <View style={styles.selectedLeft}>
              <View style={styles.selectedAvatarPlaceholder}>
                <Ionicons name="person-outline" size={24} color="#CCC" />
              </View>
              <View>
                <Text style={styles.selectedName}>Select a recipient</Text>
                <Text style={styles.selectedPhone}>Search or choose from contacts</Text>
              </View>
            </View>
          </View>
        )}

        {/* Send to another number */}
        <TouchableOpacity style={styles.anotherNumber}>
          <Ionicons name="phone-portrait-outline" size={18} color="#006B3F" />
          <Text style={styles.anotherNumberText}>Send to another number</Text>
          <Ionicons name="chevron-forward" size={16} color="#888" />
        </TouchableOpacity>

        {/* Contact Suggestions */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contactsScroll}>
          {contacts.map((contact) => (
            <TouchableOpacity
              key={contact.id}
              style={styles.contactCard}
              onPress={() => setSelectedContact(contact)}
            >
              <View style={styles.contactAvatar}>
                <Text style={styles.contactInitial}>{contact.name.charAt(0)}</Text>
              </View>
              <Text style={styles.contactName}>{contact.name.split(' ')[0]}</Text>
              <Text style={styles.contactPhone}>{contact.phone.slice(-9)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Step 2: Enter Amount */}
        <Text style={styles.stepTitle}>2. Enter Amount</Text>
        <View style={styles.amountCard}>
          <View style={styles.amountTopRow}>
            <View style={styles.amountMain}>
              <Text style={styles.currencyLabel}>UGX</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity style={styles.sourceDropdown}>
              <Ionicons name="wallet-outline" size={16} color="#006B3F" />
              <Text style={styles.sourceText}>Wallet</Text>
              <Ionicons name="chevron-down" size={14} color="#888" />
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceText}>Available Balance: UGX 125,600</Text>

          {/* Quick Amounts */}
          <View style={styles.quickAmounts}>
            {quickAmounts.map((amt) => (
              <TouchableOpacity
                key={amt}
                style={[styles.quickAmtBtn, amount === amt && styles.quickAmtBtnActive]}
                onPress={() => setAmount(amt)}
              >
                <Text style={[styles.quickAmtText, amount === amt && styles.quickAmtTextActive]}>
                  UGX {amt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Step 3: Add Note */}
        <Text style={styles.stepTitle}>3. Add Note (Optional)</Text>
        <View style={styles.noteCard}>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="What's this for? e.g. Lunch, Rent, School fees"
            placeholderTextColor="#CCCCCC"
            maxLength={60}
            multiline
          />
          <Text style={styles.charCount}>{note.length}/60</Text>
        </View>

        {/* Step 4: Choose Option */}
        <Text style={styles.stepTitle}>4. Choose Option</Text>
        <View style={styles.optionRow}>
          <TouchableOpacity
            style={[styles.optionCard, sendOption === 'instant' && styles.optionCardActive]}
            onPress={() => setSendOption('instant')}
          >
            <Ionicons name="flash" size={22} color={sendOption === 'instant' ? '#FFFFFF' : '#006B3F'} />
            <Text style={[styles.optionTitle, sendOption === 'instant' && styles.optionTitleActive]}>
              Send Instantly
            </Text>
            <Text style={[styles.optionDesc, sendOption === 'instant' && styles.optionDescActive]}>
              Money arrives immediately
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, sendOption === 'schedule' && styles.optionCardActive]}
            onPress={() => setSendOption('schedule')}
          >
            <Ionicons name="calendar-outline" size={22} color={sendOption === 'schedule' ? '#FFFFFF' : '#006B3F'} />
            <Text style={[styles.optionTitle, sendOption === 'schedule' && styles.optionTitleActive]}>
              Schedule
            </Text>
            <Text style={[styles.optionDesc, sendOption === 'schedule' && styles.optionDescActive]}>
              Choose a future date & time
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Recipients */}
        <Text style={styles.sectionTitle}>Recent Recipients</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentScroll}>
          {recentRecipients.map((person, index) => (
            <TouchableOpacity key={index} style={styles.recentItem}>
              <View style={styles.recentAvatar}>
                <Text style={styles.recentInitial}>{person.name.charAt(0)}</Text>
              </View>
              <Text style={styles.recentName}>{person.name.split(' ')[0]}</Text>
              <Text style={styles.recentPhone}>{person.phone}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Security Banner */}
        <View style={styles.securityBanner}>
          <Ionicons name="shield-checkmark" size={16} color="#006B3F" />
          <Text style={styles.securityText}>Protected with 256-bit SSL encryption</Text>
          <View style={styles.secureBadge}>
            <Ionicons name="lock-closed" size={10} color="#006B3F" />
            <Text style={styles.secureBadgeText}>100% Secure</Text>
          </View>
        </View>

        {/* Review Transfer Button */}
        <TouchableOpacity style={styles.reviewBtn}>
          <Text style={styles.reviewBtnText}>Review Transfer</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="search-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.payNavButton} onPress={() => navigation.navigate('PaymentConfirm')}>
          <Ionicons name="card-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="pricetag-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Deals</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { fontSize: 18, fontWeight: '800', color: '#006B3F', letterSpacing: 2 },
  tagline: { fontSize: 10, color: '#888' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerIcon: { position: 'relative' },
  notifBadge: { position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#D32F2F' },
  profilePic: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#212121' },
  pageSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  howBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, gap: 4 },
  howText: { fontSize: 11, fontWeight: '600', color: '#006B3F' },
  stepTitle: { fontSize: 14, fontWeight: '700', color: '#555', marginBottom: 10 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 14, paddingHorizontal: 12, height: 48,
    borderWidth: 1, borderColor: '#ECECEC',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#212121', marginLeft: 8 },
  contactBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  qrBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  selectedCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 2, borderColor: '#E8F5E9',
  },
  selectedLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectedAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  selectedAvatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  selectedName: { fontSize: 15, fontWeight: '700', color: '#212121' },
  selectedPhone: { fontSize: 12, color: '#888', marginTop: 1 },
  userBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 4 },
  userBadgeText: { fontSize: 10, fontWeight: '700', color: '#006B3F' },
  anotherNumber: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 14, padding: 14, marginBottom: 14, gap: 10,
  },
  anotherNumberText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#006B3F' },
  contactsScroll: { marginBottom: 22 },
  contactCard: { alignItems: 'center', marginRight: 18, width: 70 },
  contactAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  contactInitial: { fontSize: 20, fontWeight: '700', color: '#006B3F' },
  contactName: { fontSize: 11, fontWeight: '600', color: '#212121', textAlign: 'center' },
  contactPhone: { fontSize: 9, color: '#888', textAlign: 'center' },
  amountCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 2, borderColor: '#E8F5E9' },
  amountTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  amountMain: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  currencyLabel: { fontSize: 22, fontWeight: '700', color: '#888' },
  amountInput: { fontSize: 32, fontWeight: '800', color: '#212121', minWidth: 120 },
  sourceDropdown: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 4,
  },
  sourceText: { fontSize: 12, fontWeight: '600', color: '#006B3F' },
  balanceText: { fontSize: 12, color: '#888', marginBottom: 14 },
  quickAmounts: { flexDirection: 'row', gap: 8 },
  quickAmtBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#ECECEC',
  },
  quickAmtBtnActive: { backgroundColor: '#006B3F', borderColor: '#006B3F' },
  quickAmtText: { fontSize: 13, fontWeight: '600', color: '#555' },
  quickAmtTextActive: { color: '#FFFFFF' },
  noteCard: {
    backgroundColor: '#F8F8F8', borderRadius: 14, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: '#ECECEC', position: 'relative',
  },
  noteInput: { fontSize: 14, color: '#212121', minHeight: 50, textAlignVertical: 'top' },
  charCount: { position: 'absolute', bottom: 8, right: 12, fontSize: 11, color: '#CCC' },
  optionRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  optionCard: {
    flex: 1, backgroundColor: '#F8F8F8', borderRadius: 14, padding: 16, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#ECECEC',
  },
  optionCardActive: { backgroundColor: '#006B3F', borderColor: '#006B3F' },
  optionTitle: { fontSize: 14, fontWeight: '700', color: '#212121', marginTop: 8, marginBottom: 4 },
  optionTitleActive: { color: '#FFFFFF' },
  optionDesc: { fontSize: 11, color: '#888', textAlign: 'center' },
  optionDescActive: { color: 'rgba(255,255,255,0.8)' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#212121', marginBottom: 12 },
  recentScroll: { marginBottom: 18 },
  recentItem: { alignItems: 'center', marginRight: 20, width: 65 },
  recentAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  recentInitial: { fontSize: 18, fontWeight: '700', color: '#006B3F' },
  recentName: { fontSize: 11, fontWeight: '600', color: '#212121', textAlign: 'center' },
  recentPhone: { fontSize: 9, color: '#888', textAlign: 'center' },
  securityBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F5E9', borderRadius: 14, padding: 12, marginBottom: 18, gap: 8,
  },
  securityText: { flex: 1, fontSize: 12, color: '#006B3F', fontWeight: '500' },
  secureBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 3 },
  secureBadgeText: { fontSize: 10, fontWeight: '700', color: '#006B3F' },
  reviewBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#006B3F', paddingVertical: 16, borderRadius: 30, gap: 8,
  },
  reviewBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingVertical: 8, paddingBottom: 25,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  navItem: { alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  payNavButton: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#006B3F',
    justifyContent: 'center', alignItems: 'center', marginTop: -20,
    shadowColor: '#006B3F', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 5,
  },
});