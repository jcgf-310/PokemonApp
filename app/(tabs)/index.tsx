import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Pokemon {
  name: string;
  url: string;
  image: string;
  types: string[];
}

const CACHE_KEY = "pokemon_cache";
const CACHE_TIMESTAMP_KEY = "pokemon_cache_timestamp";
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export default function PokemonList() {
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const rotateValue = new Animated.Value(0);
  const router = useRouter();

  const startRotation = () => {
    Animated.loop(
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const rotation = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const fetchPokemon = useCallback(
    async (refresh = false) => {
      try {
        setLoading(true);
        setError("");
        const timestamp = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
        const cachedData = await AsyncStorage.getItem(CACHE_KEY);
        const now = Date.now();

        if (
          !refresh &&
          cachedData &&
          timestamp &&
          now - parseInt(timestamp) < CACHE_DURATION
        ) {
          setPokemonList(JSON.parse(cachedData));
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `https://pokeapi.co/api/v2/pokemon?limit=20&offset=${offset}`
        );
        const results = await Promise.all(
          response.data.results.map(async (pokemon: any) => {
            const detail = await axios.get(pokemon.url);
            return {
              name: pokemon.name,
              url: pokemon.url,
              image: detail.data.sprites.front_default,
              types: detail.data.types.map((t: any) => t.type.name),
            };
          })
        );

        const newList = refresh ? results : [...pokemonList, ...results];
        setPokemonList(newList);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(newList));
        await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
      } catch (err) {
        setError("Failed to load Pokémon data");
      } finally {
        setLoading(false);
      }
    },
    [offset]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setOffset(0);
    await fetchPokemon(true);
    setRefreshing(false);
  };

  useEffect(() => {
    startRotation();
    fetchPokemon();
  }, [offset]);

  const renderItem = ({ item }: { item: Pokemon }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: "/pokemon-details",
          params: { name: item.name },
        })
      }
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        backgroundColor: "#f9f9f9",
        marginVertical: 5,
        borderRadius: 8,
      }}
    >
      <Image
        source={{ uri: item.image }}
        style={{ width: 60, height: 60, marginRight: 15 }}
      />
      <View>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "bold",
            textTransform: "capitalize",
          }}
        >
          {item.name}
        </Text>
        <Text style={{ color: "gray" }}>{item.types.join(", ")}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && pokemonList.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "white",
        }}
      >
        <Animated.Image
          source={require("@/assets/pokeball.png")}
          style={{ width: 100, height: 100, transform: [{ rotate: rotation }] }}
        />
        <Text
          style={{
            marginTop: 10,
            fontSize: 16,
            color: "#E3350D",
            fontWeight: "bold",
          }}
        >
          Loading Pokémon...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 15, backgroundColor: "white" }}>
      {error ? (
        <Text style={{ color: "red", textAlign: "center" }}>{error}</Text>
      ) : (
        <FlatList
          data={pokemonList}
          keyExtractor={(item) => item.name}
          renderItem={renderItem}
          onEndReached={() => setOffset((prev) => prev + 20)}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}
