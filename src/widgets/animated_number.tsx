import { Transition, animated } from "react-spring";
import clsx from 'clsx';
/**
 * List of separtors
 */
const separators = [",", "."];

/**
 * Renders an animated JS locale formatted number string
 */
export function SAnimatedNumbers(props: { value: any; fontSize: number; dark: any; }) {
  const valueStr = (Number(props.value) || Number(0)).toString();
  const valueStrArray = valueStr.split("");

  const fontSizeValue = props.fontSize || 40;
  const fontWidth = fontSizeValue * 0.5; // font width is estimated to half the font size

  // Creates animating list where the position of a number/separator depends on the preceding number/separator
  interface Item {
    value: string;
    x: number;
    y: number;
    key: string;
  }
  
  const { items, totalWidth } = valueStrArray.reduce(
    (acc, val, i) => {
      const precedingItem: Item = acc.items[i - 1];
      const currentItem: Item = {
        value: val,
        x: 0,
        y: fontWidth,
        key: `${i}-${val}`
      };

      if (precedingItem) {
        currentItem.x = separators.includes(precedingItem.value)
          ? precedingItem.x + fontWidth * 0.5
          : precedingItem.x + fontWidth;
      }

      acc.items.push(currentItem);
      acc.totalWidth += currentItem.x - acc.totalWidth;

      return acc;
    },
    {
      items: [] as Item[],
      totalWidth: 0
    }
  );
  // debugger;

  const wrapWidth = totalWidth + fontWidth; // width of container

  // const cellStyle = { position: "absolute", left:0 };
  const springConfig = { mass: 4, tension: 100, friction: 10 };

  return (
    <div className="w-full flex justify-center">
      <div style={{ width: wrapWidth }} className={clsx(
              'flex self-center items-center justify-center font-mono text-6xl text-blue-700',
              props.dark && 'dark:text-blue-300'
            )}>
        <div className="flex">
          <Transition
            items={items}
            initial={null}
            keys={(v) => v.key}
            from={({ y }) => ({ y: -y, opacity: 0 })}
            enter={({ x }) => ({ y: 0, x, opacity: 1 })}
            // update={({ y, x }) => ({ y, x, opacity: 1 })}
            // leave={({ y, x }) => ({ y, x, opacity: 0 })}
            config={springConfig}
            trail={200}
          >
            {({ opacity, x, y, key }, item) => (
              <animated.span
                key={key}
                className={" left-0"}
                style={{
                  opacity,
                  fontSize: fontSizeValue,
                  transform: `translate3d(${x}px,${y}px,0px)`
                }}
              >
                {item.value}
              </animated.span>
            )}
          </Transition>
        </div>
      </div>
    </div>
  );
};
