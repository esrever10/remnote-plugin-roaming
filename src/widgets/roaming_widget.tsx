import { usePlugin, renderWidget, useTracker, Rem, useLocalStorageState, useSyncedStorageState } from '@remnote/plugin-sdk';
import { useEffect, useState } from 'react';
import clsx from "clsx";
import * as Re from "remeda"

const getRandomElement = (arr: any[]) =>
  arr.length ? arr[Math.floor(Math.random() * arr.length)] : undefined

export const RoamingWidget = () => {
  const plugin = usePlugin();
  const [hidden, setHidden] = useState<boolean>(true);
  const [currentRemId, setCurrentRemId] = useState<string>("");
  const [level, setLevel] = useState(0);
  const [title, setTitle] = useState("");
  const [need2LevelUp, setNeed2LevelUp] = useState(0);

  const [roamCount, setRoamCount] = useLocalStorageState<number>(
    'roamcount',
    0,
  );

  const [total, setTotal] = useLocalStorageState<number>(
    'remstotal',
    0,
  );

  const [roamedSet, setRoamedSet] = useLocalStorageState<Set<string>>(
    'roaming',
    new Set(),
  );

  const [blockSet, setBlockSet] = useLocalStorageState<Set<string>>(
    'block',
    new Set(),
  );

  var levelCustom: string = useTracker(
    async (reactivePlugin) =>
      await reactivePlugin.settings.getSetting("level_custom")
  ) as string;
  
  function updateLevel() {
    if (levelCustom && levelCustom.length > 0) {
      const levels = Re.pipe(
        levelCustom.split("\n"),
        Re.filter((x) => x.length > 0),
        Re.map((x) => {
          const [k, v] = x.trim().split("::");
          return [Number.parseInt(k), v] as [number, string]
        })
      )
      setLevel(getLevel(levels));
      setTitle(getTitle(levels));
      setNeed2LevelUp(getNextLevelExp(levels) - roamCount);
    }
  }
  
  useEffect(() => {
    const eff = async () =>{
      updateLevel();
    }
    eff()
  }, [levelCustom, roamCount]);
  
  function getLevelPair(levels: [number, string][]): [number, string] {
    var currentLevel = Re.pipe(
      levels,
      Re.filter(x => roamCount >= x[0]),
      Re.last()
    )
    if (currentLevel == undefined) {
      currentLevel = [0, "NoName"]
    }
    return currentLevel;
  }

  function getNextLevelPair(levels: [number, string][]) :[number, string] {
    var currentLevel = Re.pipe(
      levels,
      Re.filter(x => roamCount < x[0]),
      Re.first()
    )
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
    return current[1]
  }

  function getLevel(levels: [number, string][]) {
    var currentLevel = Re.pipe(
      levels,
      Re.map(x => x[0]),
      Re.zip([...new Array(levels.length).keys()]),
      Re.filter(x => roamCount >= x[0]),
      Re.last()
    )
    if (currentLevel == undefined) {
      currentLevel = [0, 0];
    }
    return currentLevel[1];
  }

  function block() {
    if (currentRemId !== "") {
      setBlockSet(blockSet.add(currentRemId));
    }
  }

  function reset() {
    setHidden(true);
    setRoamCount(0);
    setTotal(0);
    setCurrentRemId("");
    setLevel(0);
    setTitle("");
    setNeed2LevelUp(0);
    setRoamedSet(new Set());
    setBlockSet(new Set());
    updateLevel();
  }

  async function roaming() {
    setHidden(false);
    const allRems = await plugin.rem.getAll();
    setTotal(allRems.length);

    const check = async (x: Rem) =>
      [
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
        await (await x.getParentRem())?.isPowerupSlot() ?? true,
        await (await x.getParentRem())?.hasPowerup('f') ?? true,
        await (await x.getParentRem())?.hasPowerup('z') ?? true,
        await (await ((await x.getParentRem()))?.getParentRem())?.hasPowerup('f') ?? true,
        x.text === undefined,
        x.text && x.text.length === 0,
        x.text && x.text.length === 0 && x.text.toString().length === 0,
        (x.text && x.text.length > 0 && x.text[0].i === 'p'),
      ]

    const drawaCard = async () => {
      var max = 50;
      var rem = getRandomElement(allRems);
      while (max > 0) {
        console.log(`max: ${max}`)
        const checklist = await check(rem);
        console.log(checklist);
        if (checklist.every(x => x == false)) {
          return rem;
        }
        setBlockSet(blockSet.add(rem._id));
        rem = getRandomElement(allRems);
        max -= 1;
      }
      console.log("rem not found!");
      return rem;
    }

    const got: Rem = await drawaCard();
    console.log(got.text);
    
    if (got) {
      await plugin.window.openRem(got);
      setCurrentRemId(got._id);
      setRoamCount(roamCount + 1);
      setRoamedSet(roamedSet.add(got._id));
    }
    
    setHidden(true);
  }

  return (
    <div className="rounded-md grid grid-flow-row auto-rows-auto h-44 border-double border-indigo-400">
      <div className='flex justify-between'>
        <div>
          <button onClick={roaming}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" 
              className="self-center p-2 w-5 h-5">
              <path d="M2 3a1 1 0 00-1 1v1a1 1 0 001 1h16a1 1 0 001-1V4a1 1 0 00-1-1H2z" />
              <path fillRule="evenodd" d="M2 7.5h16l-.811 7.71a2 2 0 01-1.99 1.79H4.802a2 2 0 01-1.99-1.79L2 7.5zM7 11a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className='flex items-center self-center gap-2'>
          <p className='font-sans text-xs self-center text-red-300'>b: {blockSet.size}</p>
          <p className='font-sans text-xs self-center text-orange-300'>n: {need2LevelUp}</p>
          <p className='font-sans text-xs self-center text-yellow-300'>l: {level}</p>
          <p className='font-sans text-xs self-center text-green-200'>r: {roamedSet.size}</p>
          <p className='font-sans text-xs self-center text-cyan-300'>t: {total}</p>
        </div>
        <button onClick={reset}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" 
            className="p-2 w-5 h-5">
            <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <div className='flex justify-center self-center'>
        <p className='self-baseline font-mono text-6xl'>{roamCount}</p>
      </div>
      <div className='flex justify-around items-center'>
        <button className='p-2 m-2 border-dashed rounded-md' onClick={block}>Block</button>
        <div className='basis-1/2 flex flex-col items-center self-center justify-center'>
          <p className='font-mono text-1xl'>{title}</p>
          {/* <p className='font-mono text-ms'>Lv-{getLevel()}</p> */}
        </div>
        <div>
          <button className={clsx('p-2 m-2 border-dashed rounded-md', !hidden && "hidden")} onClick={roaming}>Roam</button>
          <div className={clsx(hidden && "hidden")}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="p-2 w-5 h-5">
              <path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.051.683a1 1 0 000 1.898l2.051.684a1 1 0 01.633.632l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.051-.683a1 1 0 000-1.898l-2.051-.683a1 1 0 01-.633-.633L6.95 5.684zM13.949 13.684a1 1 0 00-1.898 0l-.184.551a1 1 0 01-.632.633l-.551.183a1 1 0 000 1.898l.551.183a1 1 0 01.633.633l.183.551a1 1 0 001.898 0l.184-.551a1 1 0 01.632-.633l.551-.183a1 1 0 000-1.898l-.551-.184a1 1 0 01-.633-.632l-.183-.551z" />
            </svg>
          </div>
        </div>
      </div>
      
    </div>
  );
};

renderWidget(RoamingWidget);

