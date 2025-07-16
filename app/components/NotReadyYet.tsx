import React from "react"
import { Text as RNText, View } from "react-native"

export const NotReadyYet = ({ pageName }: { pageName: string }) => {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "yellow",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <RNText
        style={{
          color: "red",
          fontSize: 32,
          fontWeight: "bold",
          backgroundColor: "white",
          padding: 20,
        }}
      >
        {pageName ? `${pageName} isn't ready yet` : "IF YOU SEE THIS, TEXT WORKS"}
      </RNText>
    </View>
  )
}
