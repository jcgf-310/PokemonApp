import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PokemonDetails() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const [pokemon, setPokemon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await axios.get(
          `https://pokeapi.co/api/v2/pokemon/${name}`
        );
        setPokemon(response.data);
      } catch (err) {
        setError("Failed to load Pokémon details");
      } finally {
        setLoading(false);
      }
    };

    if (name) fetchDetails();
  }, [name]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E3350D" />
        <Text style={{ marginTop: 10 }}>Loading Pokémon details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "red" }}>{error}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={{ color: "white" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButtonIcon}
      >
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <Text style={styles.name}>{pokemon.name.toUpperCase()}</Text>
      <Image
        source={{
          uri: pokemon.sprites.other["official-artwork"].front_default,
        }}
        style={styles.image}
      />

      <Text style={styles.sectionTitle}>Types:</Text>
      <View style={styles.typeContainer}>
        {pokemon.types.map((t: any) => (
          <View key={t.type.name} style={styles.typePill}>
            <Text style={styles.typeText}>{t.type.name}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Base Stats:</Text>
      {pokemon.stats.map((stat: any) => (
        <Text key={stat.stat.name} style={styles.statText}>
          {stat.stat.name}: {stat.base_stat}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  image: { width: 200, height: 200, alignSelf: "center", marginVertical: 20 },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginTop: 20 },
  typeContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  typePill: {
    backgroundColor: "#eee",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  typeText: { fontWeight: "600", textTransform: "capitalize" },
  statText: { fontSize: 16, marginTop: 5, textTransform: "capitalize" },
  backButton: {
    marginTop: 20,
    backgroundColor: "#E3350D",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonIcon: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 6,
  },
});
