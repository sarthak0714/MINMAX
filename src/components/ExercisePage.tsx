import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { IoArrowBack, IoCheckmark, IoClose } from "react-icons/io5";
import { MdModeEdit } from "react-icons/md";
import type { Exercise } from "../lib/workouts";

interface ExercisePageProps {
  exercise: Exercise;
  onBack: () => void;
  onSave: (exercise: Exercise) => void;
  onDelete?: () => void;
}

const ExercisePage: React.FC<ExercisePageProps> = ({
  exercise,
  onBack,
  onSave,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(exercise.name === "New Exercise");
  const [editedExercise, setEditedExercise] = useState<Exercise>(exercise);

  const handleSave = () => {
    onSave(editedExercise);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedExercise(exercise);
    setIsEditing(false);
  };

  const addTargetMuscle = () => {
    setEditedExercise({
      ...editedExercise,
      targetMuscle: [...editedExercise.targetMuscle, ""],
    });
  };

  const removeTargetMuscle = (index: number) => {
    setEditedExercise({
      ...editedExercise,
      targetMuscle: editedExercise.targetMuscle.filter((_, i) => i !== index),
    });
  };

  const updateTargetMuscle = (index: number, value: string) => {
    const updated = [...editedExercise.targetMuscle];
    updated[index] = value;
    setEditedExercise({ ...editedExercise, targetMuscle: updated });
  };

  const addMeta = () => {
    setEditedExercise({
      ...editedExercise,
      meta: [...editedExercise.meta, ""],
    });
  };

  const removeMeta = (index: number) => {
    setEditedExercise({
      ...editedExercise,
      meta: editedExercise.meta.filter((_, i) => i !== index),
    });
  };

  const updateMeta = (index: number, value: string) => {
    const updated = [...editedExercise.meta];
    updated[index] = value;
    setEditedExercise({ ...editedExercise, meta: updated });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.95 }}
      transition={{
        duration: 0.5,
        ease: [0.4, 0.0, 0.2, 1],
        scale: { duration: 0.3 },
      }}
      className="h-[90vh] w-full max-w-4xl mx-auto p-6 overflow-y-auto"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(255,255,255,0.2) transparent",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          aria-label="Go Back"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all duration-200"
        >
          <IoArrowBack className="w-4 h-4" />
        </button>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                aria-label="Cancel Edit"
                onClick={handleCancel}
                className="flex items-center justify-center text-xs font-medium rounded-full px-4 py-2 transition-all duration-300 relative hover:bg-white/10"
                style={{
                  border: "1px solid #ef444440", // red-500 with 25% opacity
                  boxShadow:
                    "inset 0 0 20px #ef444420, inset 0 0 40px #ef444410", // Inner glow effect
                  background: "transparent",
                }}
              >
                <IoClose
                  className="w-4 h-4 transition-colors duration-300"
                  style={{ color: "#dc2626" }} // red-600 dark color
                />
              </button>
              <button
                type="button"
                aria-label="Save Changes"
                onClick={handleSave}
                className="flex items-center justify-center text-xs font-medium rounded-full px-4 py-2 transition-all duration-300 relative hover:bg-white/10"
                style={{
                  border: "1px solid #22c55e40", // green-500 with 25% opacity
                  boxShadow:
                    "inset 0 0 20px #22c55e20, inset 0 0 40px #22c55e10", // Inner glow effect
                  background: "transparent",
                }}
              >
                <IoCheckmark
                  className="w-4 h-4 transition-colors duration-300"
                  style={{ color: "#16a34a" }} // green-600 dark color
                />
              </button>
            </>
          ) : (
            <button
              aria-label="Edit Exercise"
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all duration-200"
            >
              <MdModeEdit />
            </button>
          )}
        </div>
      </div>

      {/* Exercise Name */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <label className="block text-white/80 text-sm font-medium mb-2">
          Exercise Name
        </label>
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.input
              key="edit-name"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              type="text"
              value={editedExercise.name}
              onChange={(e) =>
                setEditedExercise({ ...editedExercise, name: e.target.value })
              }
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-md rounded-lg text-white placeholder-white/60 focus:outline-none focus:bg-white/15 transition-all duration-200"
              placeholder="Enter exercise name"
            />
          ) : (
            <motion.h1
              key="view-name"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="text-2xl font-bold text-white"
            >
              {exercise.name}
            </motion.h1>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Target Muscles */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <label className="block text-white/80 text-sm font-medium mb-3">
          Target Muscles
        </label>
        <div className="space-y-2">
          <AnimatePresence>
            {isEditing ? (
              <>
                {editedExercise.targetMuscle.map((muscle, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <input
                      type="text"
                      value={muscle}
                      onChange={(e) =>
                        updateTargetMuscle(index, e.target.value)
                      }
                      className="flex-1 px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg text-white placeholder-white/60 focus:outline-none focus:bg-white/15 transition-all duration-200"
                      placeholder="Enter muscle group"
                    />
                    <button
                      type="button"
                      aria-label="Remove Item"
                      onClick={() => removeTargetMuscle(index)}
                      className="px-2 py-2 bg-red-500/20 rounded-lg text-red-300 hover:bg-red-500/30 transition-all duration-200"
                    >
                      <IoClose className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: editedExercise.targetMuscle.length * 0.1,
                  }}
                  onClick={addTargetMuscle}
                  className="w-full py-2 bg-white/10 backdrop-blur-md rounded-lg text-white/80 hover:bg-white/20 transition-all duration-200"
                >
                  + Add Muscle Group
                </motion.button>
              </>
            ) : (
              <motion.div
                className="flex flex-wrap gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {exercise.targetMuscle.map((muscle, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-white text-sm"
                  >
                    {muscle}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Meta Information */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <label className="block text-white/80 text-sm font-medium mb-3">
          Meta Information
        </label>
        <div className="space-y-2">
          <AnimatePresence>
            {isEditing ? (
              <>
                {editedExercise.meta.map((meta, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <input
                      type="text"
                      value={meta}
                      onChange={(e) => updateMeta(index, e.target.value)}
                      className="flex-1 px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg text-white placeholder-white/60 focus:outline-none focus:bg-white/15 transition-all duration-200"
                      placeholder="Enter meta info (e.g., Equipment, Difficulty)"
                    />
                    <button
                      type="button"
                      aria-label="Remove Item"
                      onClick={() => removeMeta(index)}
                      className="px-2 py-2 bg-red-500/20 rounded-lg text-red-300 hover:bg-red-500/30 transition-all duration-200"
                    >
                      <IoClose className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: editedExercise.meta.length * 0.1,
                  }}
                  onClick={addMeta}
                  className="w-full py-2 bg-white/10 backdrop-blur-md rounded-lg text-white/80 hover:bg-white/20 transition-all duration-200"
                >
                  + Add Meta Info
                </motion.button>
              </>
            ) : (
              <motion.div
                className="flex flex-wrap gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {exercise.meta.map((meta, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-sm"
                  >
                    {meta}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Delete Button */}
      {onDelete && !isEditing && (
        <div className="mt-8 pt-6">
          <button
            onClick={onDelete}
            className="w-full py-3 bg-red-500/20 rounded-lg text-red-300 hover:bg-red-500/30 transition-all duration-200"
          >
            Delete Exercise
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default ExercisePage;
