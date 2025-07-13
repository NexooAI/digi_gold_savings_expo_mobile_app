// App.js
import AppHeader from "@/app/components/AppHeader";
import { theme } from "@/constants/theme";
import { t } from "@/i18n";
import useGlobalStore from "@/store/global.store";
import React, { useState, useRef, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Animated,
  useWindowDimensions,
} from "react-native";
import { moderateScale } from "react-native-size-matters";

// FAQ Item Component
const FAQItem = ({ item, isOpen, toggleOpen, translations }) => {
  // headerOpacity was used but not defined
  const headerOpacity = useRef(new Animated.Value(1)).current;

  return (
    <View style={styles.faqItem}>
      <TouchableOpacity
        style={[
          styles.questionContainer,
          isOpen && styles.questionContainerOpen,
        ]}
        onPress={toggleOpen}
      >
        <Text style={styles.questionText}>{item.question}</Text>
        <Text style={styles.expandIcon}>{isOpen ? "-" : "+"}</Text>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.answerContainer}>
          <Text style={styles.answerText}>{item.answer}</Text>

          {item.table && (
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>{translations.times}</Text>
                <Text style={styles.tableHeaderText}>
                  {translations.immideate_bonese}
                </Text>
              </View>

              {item.table.map((row, index) => (
                <View
                  key={index}
                  style={[
                    styles.tableRow,
                    index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                  ]}
                >
                  <Text style={styles.tableCell}>{row.period}</Text>
                  <Text style={styles.tableCell}>{row.bonus}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default function App() {
  const [openItemId, setOpenItemId] = useState(null);
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const { language } = useGlobalStore();
  const translations = useMemo(
    () => ({
      defaultTitle: t("privacyPolicyTitle"), // e.g., "Privacy Policy"
      defaultContent: t("privacyPolicyContent"),
      defaultDiscription: t("privacyPolicyDiscription"),
      question1: t("question1"),
      answer1: t("answer1"),
      question2: t("question2"),
      answer2: t("answer2"),
      question3: t("question3"),
      answer3: t("answer3"),
      question4: t("question4"),
      answer4: t("answer4"),
      question5: t("question5"),
      answer5: t("answer5"),
      question6: t("question6"),
      answer6: t("answer6"),
      question7: t("question7"),
      answer7: t("answer7"),
      question8: t("question8"),
      answer8: t("answer8"),
      question9: t("question9"),
      answer9: t("answer9"),
      question10: t("question10"),
      answer10: t("answer10"),
      question11: t("question11"),
      answer11: t("answer11"),
      question12: t("question12"),
      answer12: t("answer12"),
      question13: t("question13"),
      answer13: t("answer13"),
      question14: t("question14"),
      answer14: t("answer14"),
      period1: t("period1"),
      bonus1: t("bonus1"),
      period2: t("period2"),
      bonus2: t("bonus2"),
      period3: t("period3"),
      bonus3: t("bonus3"),
      period4: t("period4"),
      bonus4: t("bonus4"),
      period5: t("period5"),
      bonus5: t("bonus5"),
      storeName: t("storeName"),
      faqQuestion: t("faqQuestion"),
      copyright: t("copyright"),
      times: t("times"),
      immideate_bonese: t("immideate_bonese"),
    }),
    [language]
  );
  const faqData = [
    {
      id: 1,
      question: translations.question1,
      answer: translations.answer1,
    },
    {
      id: 2,
      question: translations.question2,
      answer: translations.answer2,
    },
    {
      id: 3,
      question: translations.question3,
      answer: translations.answer3,
    },
    {
      id: 4,
      question: translations.question4,
      answer: translations.answer4,
    },
    // {
    //   id: 5,
    //   question: translations.question5,
    //   answer: translations.answer5,
    //   table: [
    //     { period: translations.period1, bonus: translations.bonus1 },
    //     { period: translations.period2, bonus: translations.bonus2 },
    //     { period: translations.period3, bonus: translations.bonus3 },
    //     { period: translations.period4, bonus: translations.bonus4 },
    //     { period: translations.period5, bonus: translations.bonus5 },
    //   ],
    // },
    {
      id: 6,
      question: translations.question6,
      answer: translations.answer6,
    },
    {
      id: 7,
      question: translations.question7,
      answer: translations.answer7,
    },
    {
      id: 8,
      question: translations.question8,
      answer: translations.answer8,
    },
    {
      id: 9,
      question: translations.question9,
      answer: translations.answer9,
    },
    {
      id: 10,
      question: translations.question10,
      answer: translations.answer10,
    },
    {
      id: 11,
      question: translations.question11,
      answer: translations.answer11,
    },
    {
      id: 12,
      question: translations.question12,
      answer: translations.answer12,
    },
    {
      id: 13,
      question: translations.question13,
      answer: translations.answer13,
    },
    {
      id: 14,
      question: translations.question14,
      answer: translations.answer14,
    },
  ];

  const toggleItem = (id) => {
    setOpenItemId(openItemId === id ? null : id);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#fff" }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar backgroundColor="#5a000b" barStyle="light-content" />
        <AppHeader showBackButton={true} backRoute="index" showDrawerToggle={false} />
        <ScrollView
          contentContainerStyle={{ paddingTop: 20, paddingHorizontal: 16 }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 20,
              padding: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 20,
              elevation: 5,
            }}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: "800",
                color: theme.colors.primary,
                marginBottom: 24,
                textAlign: "center",
                fontFamily: "serif",
              }}
            >
              {translations.faqQuestion}
            </Text>

            <Text
              style={{
                fontSize: 16,
                color: "#666",
                lineHeight: 24,
                marginBottom: 32,
                letterSpacing: 0.4,
                textAlign: "center",
              }}
            >
              Find answers to commonly asked questions about our services and policies.
            </Text>

            {faqData.map((item) => (
              <FAQItem
                key={item.id}
                item={item}
                isOpen={openItemId === item.id}
                toggleOpen={() => toggleItem(item.id)}
                translations={translations}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  faqItem: {
    marginBottom: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    overflow: "hidden",
  },
  questionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  questionContainerOpen: {
    backgroundColor: theme.colors.primary,
  },
  questionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 12,
  },
  expandIcon: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  answerContainer: {
    padding: 16,
    backgroundColor: "white",
  },
  answerText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
  },
  tableContainer: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: theme.colors.primary,
  },
  tableHeaderText: {
    flex: 1,
    padding: 12,
    color: "white",
    fontWeight: "600",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
  },
  tableRowEven: {
    backgroundColor: "#f8f9fa",
  },
  tableRowOdd: {
    backgroundColor: "white",
  },
  tableCell: {
    flex: 1,
    padding: 12,
    textAlign: "center",
    fontSize: 14,
    color: "#333",
  },
});
