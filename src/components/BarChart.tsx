import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '../config/theme';

export interface Bar {
  label: string;
  value: number;
  /** Longer label for the tapped-bar readout, e.g. "Week 3 · 6–12 Nov". */
  detail?: string;
}

interface Props {
  title: string;
  data: Bar[];
  color: string;
  unit: string;
  height?: number;
}

const PAD_TOP = 22; // room for value labels
const PAD_BOTTOM = 22; // room for x labels
const RADIUS = 4;

/** Bar with only the top corners rounded, anchored to the baseline. */
function barPath(x: number, y: number, w: number, h: number) {
  if (h <= 0) return '';
  const r = Math.min(RADIUS, w / 2, h);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

/**
 * Single-series bar chart. Labels only the latest and highest bars; tap any
 * bar to read its value. The title names the series, so there is no legend.
 */
export function BarChart({ title, data, color, unit, height = 150 }: Props) {
  const [width, setWidth] = useState(0);
  const [sel, setSel] = useState<number | null>(null);

  const n = data.length;
  const max = Math.max(1, ...data.map((d) => d.value));
  const plotH = height - PAD_TOP - PAD_BOTTOM;
  const slot = n ? width / n : 0;
  const barW = Math.max(4, Math.min(28, slot - 6));
  const maxIdx = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);
  const labelled = new Set([n - 1, maxIdx]);
  const showEvery = n > 8 ? Math.ceil(n / 8) : 1;

  const picked = sel !== null && data[sel] ? data[sel] : data[n - 1];

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.title}>{title}</Text>
        {picked && (
          <Text style={styles.readout}>
            {picked.detail ?? picked.label}: <Text style={styles.readoutValue}>{picked.value}</Text> {unit}
          </Text>
        )}
      </View>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
        {width > 0 && n > 0 && (
          <Svg width={width} height={height}>
            <Line
              x1={0}
              x2={width}
              y1={PAD_TOP + plotH}
              y2={PAD_TOP + plotH}
              stroke={colors.border}
              strokeWidth={1}
            />
            {data.map((d, i) => {
              const h = (d.value / max) * plotH;
              const x = i * slot + (slot - barW) / 2;
              const y = PAD_TOP + plotH - h;
              const active = sel === null || sel === i;
              return (
                <Path key={`b${i}`} d={barPath(x, y, barW, h)} fill={color} opacity={active ? 1 : 0.35} />
              );
            })}
            {data.map((d, i) =>
              labelled.has(i) || sel === i ? (
                <SvgText
                  key={`v${i}`}
                  x={i * slot + slot / 2}
                  y={PAD_TOP + plotH - (d.value / max) * plotH - 6}
                  fill={colors.text}
                  fontSize={11}
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {String(d.value)}
                </SvgText>
              ) : null,
            )}
            {data.map((d, i) =>
              i % showEvery === 0 || i === n - 1 ? (
                <SvgText
                  key={`x${i}`}
                  x={i * slot + slot / 2}
                  y={height - 6}
                  fill={colors.muted}
                  fontSize={11}
                  textAnchor="middle"
                >
                  {d.label}
                </SvgText>
              ) : null,
            )}
            {/* Full-height hit targets, wider than the bars. */}
            {data.map((_, i) => (
              <Rect
                key={`h${i}`}
                x={i * slot}
                y={0}
                width={slot}
                height={height}
                fill="transparent"
                onPress={() => setSel((s) => (s === i ? null : i))}
              />
            ))}
          </Svg>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  head: { gap: 2 },
  title: { color: colors.text, fontSize: 15, fontWeight: '700' },
  readout: { color: colors.muted, fontSize: 13 },
  readoutValue: { color: colors.text, fontWeight: '700' },
});
