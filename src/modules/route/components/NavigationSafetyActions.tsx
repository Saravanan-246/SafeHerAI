import React from "react";
import { StyleSheet, View } from "react-native";
import SOSAction from "../../sos/components/SOSAction";

interface NavigationSafetyActionsProps {
  panelExpanded: boolean;
}

export default function NavigationSafetyActions({
  panelExpanded,
}: NavigationSafetyActionsProps) {
  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFillObject}>
      <SOSAction
        variant="floating"
        style={!panelExpanded ? styles.minimizedSOS : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  minimizedSOS: {
    bottom: 105,
  },
});
