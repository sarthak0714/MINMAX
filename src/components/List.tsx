import React, {
  useRef,
  useState,
  useEffect,
  type ReactNode,
  type MouseEventHandler,
  type UIEvent,
} from "react";
import { motion, useInView } from "motion/react";
import { CgMathPlus } from "react-icons/cg";

interface AnimatedItemProps {
  children: ReactNode;
  delay?: number;
  index: number;
  onMouseEnter?: MouseEventHandler<HTMLDivElement>;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

const AnimatedItem: React.FC<AnimatedItemProps> = ({
  children,
  delay = 0,
  index,
  onMouseEnter,
  onClick,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5, once: false });
  return (
    <motion.div
      ref={ref}
      data-index={index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
      transition={{ duration: 0.2, delay }}
      className="mb-4 cursor-pointer"
    >
      {children}
    </motion.div>
  );
};

interface Exercise {
  name: string;
  targetMuscle: string[];
  meta: string[];
}

interface AnimatedListProps {
  items?: Exercise[];
  onItemSelect?: (item: Exercise, index: number) => void;
  showGradients?: boolean;
  enableArrowNavigation?: boolean;
  className?: string;
  itemClassName?: string;
  displayScrollbar?: boolean;
  initialSelectedIndex?: number;
}

const List: React.FC<AnimatedListProps> = ({
  items = [],
  onItemSelect,
  showGradients = true,
  enableArrowNavigation = true,
  className = "",
  itemClassName = "",
  displayScrollbar = true,
  initialSelectedIndex = -1,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] =
    useState<number>(initialSelectedIndex);
  const [keyboardNav, setKeyboardNav] = useState<boolean>(false);
  const [topGradientOpacity, setTopGradientOpacity] = useState<number>(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredItems, setFilteredItems] = useState<Exercise[]>(items);

  // Filter items based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.targetMuscle.some((muscle) =>
            muscle.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
      setFilteredItems(filtered);
    }
    setSelectedIndex(-1); // Reset selection when filtering
  }, [searchQuery, items]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } =
      e.target as HTMLDivElement;
    setTopGradientOpacity(Math.min(scrollTop / 50, 1));
    const bottomDistance = scrollHeight - (scrollTop + clientHeight);
    setBottomGradientOpacity(
      scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1)
    );
  };

  useEffect(() => {
    if (!enableArrowNavigation) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex((prev) =>
          Math.min(prev + 1, filteredItems.length - 1)
        );
      } else if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        if (selectedIndex >= 0 && selectedIndex < filteredItems.length) {
          e.preventDefault();
          if (onItemSelect) {
            onItemSelect(filteredItems[selectedIndex], selectedIndex);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredItems, selectedIndex, onItemSelect, enableArrowNavigation]);

  useEffect(() => {
    if (!keyboardNav || selectedIndex < 0 || !listRef.current) return;
    const container = listRef.current;
    const selectedItem = container.querySelector(
      `[data-index="${selectedIndex}"]`
    ) as HTMLElement | null;
    if (selectedItem) {
      const extraMargin = 50;
      const containerScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const itemTop = selectedItem.offsetTop;
      const itemBottom = itemTop + selectedItem.offsetHeight;
      if (itemTop < containerScrollTop + extraMargin) {
        container.scrollTo({ top: itemTop - extraMargin, behavior: "smooth" });
      } else if (
        itemBottom >
        containerScrollTop + containerHeight - extraMargin
      ) {
        container.scrollTo({
          top: itemBottom - containerHeight + extraMargin,
          behavior: "smooth",
        });
      }
    }
    setKeyboardNav(false);
  }, [selectedIndex, keyboardNav]);

  return (
    <div
      className={`relative h-[90vh] w-full max-w-2xl ${className}`}
      style={{
        // Fade out to transparent at BOTH the top and bottom edge
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 0%, black 90%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 0%, black 90%, transparent 100%)",
      }}
    >
      {/* Search Bar and Add Button */}
      <div className="flex items-center gap-1 p-4 pb-2 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-6 pr-4 h-[60px] bg-white/10 backdrop-blur-md border border-white/20 rounded-l-full rounded-r-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all duration-200"
          />
        </div>
        <button
          type="button"
          aria-label="Add new exercise"
          className="w-[60px] h-[60px] bg-white/10 backdrop-blur-md border border-white/20 rounded-l-lg rounded-r-full flex items-center justify-center hover:bg-white/20 hover:border-white/40 transition-all duration-200"
        >
          <CgMathPlus className="w-6 h-6 text-white" />
        </button>
        <hr className="" />
      </div>

      <div
        ref={listRef}
        className={`h-[calc(90vh-120px)] overflow-y-auto p-4 pt-2 relative ${
          displayScrollbar
            ? "[&::-webkit-scrollbar]:w-[8px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-[4px]"
            : "scrollbar-hide"
        }`}
        onScroll={handleScroll}
        style={{
          scrollbarWidth: displayScrollbar ? "thin" : "none",
          scrollbarColor: "rgba(255,255,255,0.2) transparent",
          scrollBehavior: "smooth",
        }}
      >
        {filteredItems.map((item, index) => (
          <AnimatedItem
            key={index}
            delay={0.1}
            index={index}
            onMouseEnter={() => setSelectedIndex(index)}
            onClick={() => {
              setSelectedIndex(index);
              if (onItemSelect) {
                onItemSelect(item, index);
              }
            }}
          >
            <div
              className={`p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full transition-all duration-200 ${
                selectedIndex === index
                  ? "bg-white/20 border-white/40 shadow-lg"
                  : "hover:bg-white/15"
              } ${itemClassName}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-white m-0 font-medium">{item.name}</p>
                {item.targetMuscle.length > 0 && (
                  <span className="px-2 py-1 bg-white/20 text-white/80 text-xs rounded-full border border-white/30">
                    {item.targetMuscle[0]}
                  </span>
                )}
              </div>
            </div>
          </AnimatedItem>
        ))}
      </div>
      {showGradients && (
        <>
          <div
            className="absolute top-0 left-0 right-0 h-[50px] bg-gradient-to-b from-black/50 to-transparent pointer-events-none transition-opacity duration-300 ease"
            style={{ opacity: topGradientOpacity }}
          ></div>
          <div
            className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-black/50 to-transparent pointer-events-none transition-opacity duration-300 ease"
            style={{ opacity: bottomGradientOpacity }}
          ></div>
        </>
      )}
    </div>
  );
};

export default List;
