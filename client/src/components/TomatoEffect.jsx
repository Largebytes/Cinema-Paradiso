// A tomato flies from the bottom of the screen to (x, y) and splats. x and y are percentages.
export default function TomatoEffect({ x, y }) {
  const position = { '--target-x': `${x}%`, '--target-y': `${y}%` };
  return (
    <>
      <span className="tomato-fly" style={position}>🍅</span>
      <span className="tomato-splat" style={position} />
    </>
  );
}
