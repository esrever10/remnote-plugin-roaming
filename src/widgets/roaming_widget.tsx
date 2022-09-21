import {
  usePlugin,
  renderWidget,
  useTracker,
  Rem,
  useLocalStorageState,
  AppEvents,
  useAPIEventListener,
} from '@remnote/plugin-sdk';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import * as Re from 'remeda';
import ConfirmDialog from './confirm_dialog';

const getRandomElement = (arr: any[]) =>
  arr.length ? arr[Math.floor(Math.random() * arr.length)] : undefined;

export const RoamingWidget = () => {
  console.log(document.body.classList.contains('dark'));
  const plugin = usePlugin();
  const [dialogHidden, setDialogHidden] = useState<boolean>(true);
  const [dark, setDark] = useState(() => document.body.classList.contains('dark'));
  const [currentRemId, setCurrentRemId] = useState<string>('');
  const [level, setLevel] = useState(0);
  const [title, setTitle] = useState('');
  const [need2LevelUp, setNeed2LevelUp] = useState(0);

  const [roamCount, setRoamCount] = useLocalStorageState<number>('roamcount', 0);

  const [total, setTotal] = useLocalStorageState<number>('remstotal', 0);

  const [roamedSet, setRoamedSet] = useLocalStorageState<Set<string>>('roaming', new Set());

  const [blockSet, setBlockSet] = useLocalStorageState<Set<string>>('block', new Set());


  useAPIEventListener(AppEvents.setDarkMode, undefined, async (data) => {
    setDark(data.darkMode);
  });

  var levelCustom: string = useTracker(
    async (reactivePlugin) => await reactivePlugin.settings.getSetting('level_custom')
  ) as string;

  function updateLevel() {
    if (levelCustom && levelCustom.length > 0) {
      const levels = Re.pipe(
        levelCustom.split('\n'),
        Re.filter((x) => x.length > 0),
        Re.map((x) => {
          const [k, v] = x.trim().split('::');
          return [Number.parseInt(k), v] as [number, string];
        })
      );
      setLevel(getLevel(levels));
      setTitle(getTitle(levels));
      setNeed2LevelUp(getNextLevelExp(levels) - roamCount);
    }
  }

  useEffect(() => {
    const eff = async () => {
      updateLevel();
    };
    eff();
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
      setBlockSet(blockSet.add(currentRemId));
    }
    roaming();
  }

  function close() {
    setDialogHidden(true);
  }

  function reset() {
    setDialogHidden(true);
    setRoamCount(0);
    setTotal(0);
    setCurrentRemId('');
    setLevel(0);
    setTitle('');
    setNeed2LevelUp(0);
    setRoamedSet(new Set());
    setBlockSet(new Set());
    updateLevel();
  }

  function showConfirm() {
    setDialogHidden(false);
  }

  async function roaming() {
    const allRems = await plugin.rem.getAll();
    setTotal(allRems.length);

    const check = async (x: Rem) => [
      x === undefined,
      blockSet.has(x._id),
      await x.isPowerupEnum(),
      await x.isPowerupProperty(),
      await x.isPowerup(),
      await x.isPowerupPropertyListItem(),
      await x.isPowerupSlot(),
      await x.isSlot(),
      await x.isDocument(),
      await x.hasPowerup('f'),
      await x.hasPowerup('z'),
      (await (await x.getParentRem())?.isPowerupSlot()) ?? true,
      (await (await x.getParentRem())?.hasPowerup('f')) ?? true,
      (await (await x.getParentRem())?.hasPowerup('z')) ?? true,
      (await (await (await x.getParentRem())?.getParentRem())?.hasPowerup('f')) ?? true,
      x.text === undefined,
      x.text && x.text.length === 0,
      x.text && x.text.length === 0 && x.text.toString().length === 0,
      x.text && x.text.length > 0 && x.text[0].i === 'p',
    ];

    const drawaCard = async () => {
      var max = 50;
      var rem = getRandomElement(allRems);
      while (max > 0) {
        console.log(`max: ${max}`);
        const checklist = await check(rem);
        console.log(checklist);
        if (checklist.every((x) => x == false)) {
          return rem;
        }
        setBlockSet(blockSet.add(rem._id));
        rem = getRandomElement(allRems);
        max -= 1;
      }
      console.log('rem not found!');
      return rem;
    };

    const got: Rem = await drawaCard();
    console.log(got.text);

    if (got) {
      await plugin.window.openRem(got);
      setCurrentRemId(got._id);
      setRoamCount(roamCount + 1);
      setRoamedSet(roamedSet.add(got._id));
    }
  }

  return (
    <div className={clsx("rounded-md grid grid-flow-row auto-rows-auto h-200 border-double border-indigo-400", dark && "dark:border-indigo-700")}>
      <ConfirmDialog onConfirm={reset} onClose={close} dark={dark} open={!dialogHidden}></ConfirmDialog>
      <div className="flex justify-between">
        <div className='flex-none'>
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
          <p className={clsx("font-sans text-xs self-center text-red-700", dark && "dark:text-red-300")}>B:{blockSet.size}</p>
          <p className={clsx("font-sans text-xs self-center text-orange-700", dark && "dark:text-orange-300")}>N:{need2LevelUp}</p>
          <p className={clsx("font-sans text-xs self-center text-yellow-700", dark && "dark:text-yellow-300")}>L:{level}</p>
          <p className={clsx("font-sans text-xs self-center text-green-700", dark && "dark:text-green-200")}>R:{roamedSet.size}</p>
          <p className={clsx("font-sans text-xs self-center text-cyan-700", dark && "dark:text-cyan-300")}>T:{total}</p>
        </div>
        <div className='w-8'></div>
      </div>
      <div className="flex justify-center self-center">
        <p className={clsx("self-baseline font-mono text-6xl text-blue-700", dark && "dark:text-blue-300")}>{roamCount}</p>
        {/* <p className={clsx("self-baseline font-mono text-6xl")}>{roamCount}</p> */}
      </div>
      <div className="flex justify-around items-center">
        <button className="p-2 m-2 border-dashed rounded-md" onClick={block}>
          Block
        </button>
        <div className="basis-1/2 flex flex-col items-center self-center justify-center">
          <p className={clsx("font-mono text-1xl text-indigo-700", dark && "dark:text-indigo-300")}>{title}</p>
          {/* <p className={clsx("font-mono text-1xl")}>{title}</p> */}
        </div>
        <div>
          <button className="p-2 m-2 border-dashed rounded-md" onClick={roaming}>
            Roam
          </button>
        </div>
      </div>
    </div>
  );
};

renderWidget(RoamingWidget);