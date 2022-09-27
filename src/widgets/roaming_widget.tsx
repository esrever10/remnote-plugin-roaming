import {
  usePlugin,
  renderWidget,
  useTracker,
  Rem,
  useLocalStorageState,
  AppEvents,
  useAPIEventListener,
  useOnMessageBroadcast,
} from '@remnote/plugin-sdk';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { animated, useSpring, useSprings } from 'react-spring';
import * as Re from 'remeda';
import { SAnimatedNumbers } from './animated_number';
import ConfirmDialog from './confirm_dialog';

const getRandomElement = (arr: any[]) =>
  arr.length ? arr[Math.floor(Math.random() * arr.length)] : undefined;

interface MysteriousProps {
  open: boolean;
  check: boolean;
  className: string;
  children: string;
}

const MysteriousText = (props: React.PropsWithChildren<MysteriousProps>) => {
  const [animations, api] = useSprings(props.children.length, (i) => ({
    opacity: 1,
    delay: Math.random() * 350,
  }));
  const content = useRef(props.children);

  useEffect(() => {
    if ((props.open && !props.check) || content.current !== props.children) {
      api((i) => ({ opacity: 1, from: { opacity: 0 }, delay: Math.random() * 350 }));
      content.current = props.children;
    }
  });

  return (
    <>
      {props.children.split('').map((item: string, index: number) => (
        <animated.span key={index} style={animations[index]} {...props}>
          {item}
        </animated.span>
      ))}
    </>
  );
};

export const RoamingWidget = () => {
  // console.log(document.body.classList.contains('dark'));
  const plugin = usePlugin();
  const [dialogHidden, setDialogHidden] = useState<boolean>(true);
  const [dark, setDark] = useState(false);
  const [currentRemId, setCurrentRemId] = useState<string>('');
  const [level, setLevel] = useState(0);
  const [title, setTitle] = useState('');
  const [need2LevelUp, setNeed2LevelUp] = useState(0);

  const [roamCount, setRoamCount] = useLocalStorageState<number>('roamcount', 0);

  const [roamedSet, setRoamedSet] = useLocalStorageState<string[]>('roamingset', []);

  const [blockSet, setBlockSet] = useLocalStorageState<string[]>('blockset', []);

  const [allRems, setAllRems] = useLocalStorageState<string[]>('allrems', []);

  const isSimpleView = useTracker(
    async (reactivePlugin) => await reactivePlugin.settings.getSetting('roaming_mode')
  ) as boolean;

  useOnMessageBroadcast(undefined, (message) => {
    roaming();
  });

  useAPIEventListener(AppEvents.setDarkMode, undefined, async (data) => {
    setDark(data.darkMode);
  });

  var levelCustom: string = useTracker(
    async (reactivePlugin) => await reactivePlugin.settings.getSetting('level_custom')
  ) as string;

  function updateLevel() {
    if (levelCustom && levelCustom.length > 0) {
      const levels: [number, string][] = Re.pipe(
        levelCustom.split('\n'),
        Re.filter((x) => x.length > 0),
        Re.map((x) => {
          const [k, v] = x.trim().split('::');
          return [Number.parseInt(k), v] as [number, string];
        })
      );
      setLevel(getLevel(levels));
      const newTitle = getTitle(levels);
      setTitle(newTitle);
      if (title !== newTitle) {
        setLevelupnow(true);
      }
      setNeed2LevelUp(getNextLevelExp(levels) - roamCount);
    }
  }

  useEffect(() => {
    updateLevel();
    setDark(document.body.classList.contains('dark'));
  }, [levelCustom, roamCount]);

  function getLevelPair(levels: [number, string][]): [number, string] {
    var currentLevel = Re.pipe(
      levels,
      Re.filter((x) => roamCount >= x[0]),
      Re.last()
    );
    if (currentLevel == undefined) {
      currentLevel = [0, 'NoName'];
    }
    return currentLevel;
  }

  function getNextLevelPair(levels: [number, string][]): [number, string] {
    var currentLevel = Re.pipe(
      levels,
      Re.filter((x) => roamCount < x[0]),
      Re.first()
    );
    if (currentLevel === undefined) {
      currentLevel = getLevelPair(levels);
    }
    return currentLevel;
  }

  function getNextLevelExp(levels: [number, string][]): number {
    const next = getNextLevelPair(levels);
    return next[0];
  }

  function getTitle(levels: [number, string][]) {
    const current = getLevelPair(levels);
    return current[1];
  }

  function getLevel(levels: [number, string][]) {
    var currentLevel = Re.pipe(
      levels,
      Re.map((x) => x[0]),
      Re.zip([...new Array(levels.length).keys()]),
      Re.filter((x) => roamCount >= x[0]),
      Re.last()
    );
    if (currentLevel == undefined) {
      currentLevel = [0, 0];
    }
    return currentLevel[1];
  }

  function block() {
    if (currentRemId !== '') {
      blockSet.push(currentRemId);
      setBlockSet([...new Set(blockSet)]);
    }
    roaming();
  }

  function close() {
    setDialogHidden(true);
  }

  function reset() {
    setDialogHidden(true);
    setRoamCount(0);
    setCurrentRemId('');
    setLevel(0);
    setTitle('');
    setNeed2LevelUp(0);
    setRoamedSet([]);
    setBlockSet([]);
    setAllRems([]);
    updateLevel();
  }

  function showConfirm() {
    setDialogHidden(false);
  }

  async function updateAllRems() {
    const tempRems = await plugin.rem.getAll();
    const newAllRems = Re.map(tempRems, (x) => x._id);
    await setAllRems(newAllRems);
  }

  async function roaming() {
    if (allRems.length == 0) {
      await updateAllRems();
    }

    const check = async (x: Rem | undefined) =>
      x === undefined
        ? [true]
        : [
            blockSet.includes(x._id),
            await x.isPowerupEnum(),
            await x.isPowerupProperty(),
            await x.isPowerup(),
            await x.isPowerupPropertyListItem(),
            await x.isPowerupSlot(),
            await x.isSlot(),
            await x.isDocument(),
            await x.hasPowerup('f'),
            await x.hasPowerup('b'),
            await x.hasPowerup('z'),
            (await (await x.getParentRem())?.isPowerupSlot()) ?? true,
            (await (await x.getParentRem())?.hasPowerup('f')) ?? true,
            (await (await x.getParentRem())?.hasPowerup('z')) ?? true,
            (await (await (await x.getParentRem())?.getParentRem())?.hasPowerup('f')) ?? true,
            x.text === undefined,
            x.text && x.text.length === 0,
            x.text && x.text.length === 0 && x.text.toString().length === 0,
            x.text && x.text.length > 0 && x.text[0].i === 'p',
            x.text && x.text.length > 0 && x.text[0].i === 'q',
          ];

    const drawaCard = async () => {
      var max = 50;
      var haveto = undefined;
      while (max > 0) {
        var remid = getRandomElement(allRems);
        const rem = await plugin.rem.findOne(remid);
        console.log(`max: ${max}`);
        const checklist = await check(rem);
        console.log(checklist);
        if (checklist.every((x) => x == false)) {
          return rem;
        }
        if (rem) {
          blockSet.push(rem._id);
          setBlockSet([...new Set(blockSet)]);
          haveto = rem;
        }
        max -= 1;
      }
      return haveto;
    };

    const got: Rem | undefined = await drawaCard();
    if (got) {
      await plugin.window.openRem(got);
      setCurrentRemId(got._id);
      setRoamCount(roamCount + 1);
      roamedSet.push(got._id);
      setRoamedSet([...new Set(roamedSet)]);
      updateLevel();
    } else {
      updateAllRems();
      console.log('rem not found!');
    }
  }

  const [roamBtnState, toggleRoam] = useState(true);
  const { roamX } = useSpring({
    from: { roamX: 0 },
    roamX: roamBtnState ? 1 : 0,
    config: { duration: 1000 },
  });

  const [blockBtnState, toggleBlock] = useState(true);
  const { blockX } = useSpring({
    from: { blockX: 0 },
    blockX: blockBtnState ? 1 : 0,
    config: { duration: 1000 },
  });

  const [allBtnState, toggleAll] = useState(true);
  const { allX } = useSpring({
    from: { allX: 0 },
    allX: allBtnState ? 1 : 0,
    config: { duration: 1000 },
  });

  const [loadState, toggleLoad] = useState(false);
  const loadStyles = useSpring({
    from: {
      transform: 'rotateZ(0deg)',
      opacity: 0,
    },
    to: {
      transform: 'rotateZ(360deg)',
      opacity: loadState ? 1 : 0,
    },
    loop: true,
  });

  const [levelupNow, setLevelupnow] = useState(false);

  const slideInStyles = useSpring({
    config: { tension: 210, friction: 20 },
    from: { opacity: 0, height: 0 },
    to: {
      opacity: dialogHidden ? 0 : 1,
      height: dialogHidden ? 0 : 360,
    },
  });

  if (isSimpleView) {
    return (
      <div
        className={clsx(
          'rounded-md grid grid-flow-row auto-rows-auto h-800 border-double border-indigo-400',
          dark && 'dark:border-indigo-300'
        )}
      >
        <div className="flex justify-around items-center">
          <button
            onClick={() => {
              toggleBlock(!blockBtnState);
              block();
            }}
          >
            <animated.div
              className="p-2 m-2 border-dashed rounded-md"
              style={{
                scale: blockX.to({
                  range: [0, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 1],
                  output: [1, 0.97, 0.9, 1.1, 0.9, 1.1, 1.03, 1],
                }),
              }}
            >
              Block
            </animated.div>
          </button>
          <div>
            <button
              onClick={() => {
                toggleRoam(!roamBtnState);
                roaming();
              }}
            >
              <animated.div
                className="p-2 m-2 border-dashed rounded-md"
                style={{
                  scale: roamX.to({
                    range: [0, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 1],
                    output: [1, 0.97, 0.9, 1.1, 0.9, 1.1, 1.03, 1],
                  }),
                }}
              >
                Roam
              </animated.div>
            </button>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div
        className={clsx(
          'rounded-md grid grid-flow-row auto-rows-auto h-800 border-double border-indigo-400',
          dark && 'dark:border-indigo-300'
        )}
      >
        <animated.div style={{ ...slideInStyles, overflow: 'hidden' }}>
          <ConfirmDialog
            onConfirm={reset}
            onClose={close}
            dark={dark}
            open={!dialogHidden}
          ></ConfirmDialog>
        </animated.div>

        <div className="flex justify-between">
          <div className="flex">
            <button onClick={showConfirm}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="p-2 w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          <div className="flex gap-2">
            <p
              className={clsx(
                'font-sans text-xs self-center text-red-700',
                dark && 'dark:text-red-300'
              )}
            >
              B:{blockSet.length}
            </p>
            <p
              className={clsx(
                'font-sans text-xs self-center text-orange-700',
                dark && 'dark:text-orange-300'
              )}
            >
              N:{need2LevelUp}
            </p>
            <p
              className={clsx(
                'font-sans text-xs self-center text-yellow-700',
                dark && 'dark:text-yellow-300'
              )}
            >
              L:{level}
            </p>
            <p
              className={clsx(
                'font-sans text-xs self-center text-green-700',
                dark && 'dark:text-green-200'
              )}
            >
              R:{roamedSet.length}
            </p>
            <p
              className={clsx(
                'font-sans text-xs self-center text-green-700',
                dark && 'dark:text-green-200'
              )}
            >
              <MysteriousText
                open={loadState}
                check={false}
                className={clsx(
                  'font-sans text-xs self-center text-cyan-700',
                  dark && 'dark:text-cyan-300'
                )}
              >
                {`T:${allRems.length}`}
              </MysteriousText>
            </p>
          </div>
          <div className="flex">
            <animated.div className="self-center" style={loadStyles}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
                  clipRule="evenodd"
                />
              </svg>
            </animated.div>
            <button
              onClick={async () => {
                toggleAll(!allBtnState);
                toggleLoad(true);
                await updateAllRems();
                toggleLoad(false);
              }}
            >
              <animated.div
                className="p-2"
                style={{
                  scale: allX.to({
                    range: [0, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 1],
                    output: [1, 0.97, 0.9, 1.1, 0.9, 1.1, 1.03, 1],
                  }),
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 1c3.866 0 7 1.79 7 4s-3.134 4-7 4-7-1.79-7-4 3.134-4 7-4zm5.694 8.13c.464-.264.91-.583 1.306-.952V10c0 2.21-3.134 4-7 4s-7-1.79-7-4V8.178c.396.37.842.688 1.306.953C5.838 10.006 7.854 10.5 10 10.5s4.162-.494 5.694-1.37zM3 13.179V15c0 2.21 3.134 4 7 4s7-1.79 7-4v-1.822c-.396.37-.842.688-1.306.953-1.532.875-3.548 1.369-5.694 1.369s-4.162-.494-5.694-1.37A7.009 7.009 0 013 13.179z"
                    clipRule="evenodd"
                  />
                </svg>
              </animated.div>
            </button>
          </div>
        </div>
        <div className="flex justify-center self-center">
          <SAnimatedNumbers value={roamCount} fontSize={60} dark={dark} />
        </div>
        <div className="flex justify-around items-center">
          <button
            onClick={() => {
              toggleBlock(!blockBtnState);
              block();
            }}
          >
            <animated.div
              className="p-2 m-2 border-dashed rounded-md"
              style={{
                scale: blockX.to({
                  range: [0, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 1],
                  output: [1, 0.97, 0.9, 1.1, 0.9, 1.1, 1.03, 1],
                }),
              }}
            >
              Block
            </animated.div>
          </button>
          <div className="basis-1/2 flex flex-col items-center self-center justify-center">
            <p
              className={clsx('font-mono text-1xl text-indigo-700', dark && 'dark:text-indigo-300')}
            >
              <MysteriousText
                check={true}
                open={levelupNow}
                className={clsx(
                  'font-mono text-1xl text-indigo-700',
                  dark && 'dark:text-indigo-300'
                )}
              >
                {title}
              </MysteriousText>
            </p>
          </div>
          <div>
            <button
              onClick={() => {
                toggleRoam(!roamBtnState);
                roaming();
              }}
            >
              <animated.div
                className="p-2 m-2 border-dashed rounded-md"
                style={{
                  scale: roamX.to({
                    range: [0, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 1],
                    output: [1, 0.97, 0.9, 1.1, 0.9, 1.1, 1.03, 1],
                  }),
                }}
              >
                Roam
              </animated.div>
            </button>
          </div>
        </div>
      </div>
    );
  }
};

renderWidget(RoamingWidget);
