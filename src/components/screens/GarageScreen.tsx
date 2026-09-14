"use client";

import { NeonText, SpotlightCard } from "@/components/ui";
import { CAR_CONFIGS } from "@/lib/constants";
import { COLORS } from "@/lib/constants";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/stores/gameStore";

const Garage = () => {
  const router = useRouter();
  const setSelectedCar = useGameStore((s) => s.setSelectedCar);

  const handleSelectCar = (carId: string) => {
    setSelectedCar(carId);
    router.push("/race?mode=single");
  };

  return (
    <div className="min-h-screen w-full bg-background py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <NeonText color={COLORS.primary} glowIntensity="high" className="text-4xl sm:text-5xl mb-4">
            GARAGE
          </NeonText>
          <motion.p
            className="text-secondary max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Choose your exotic machine. Each car has unique handling characteristics and performance specs.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CAR_CONFIGS.map((car, i) => (
            <motion.div
              key={car.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <SpotlightCard
                title={car.name}
                subtitle={`${car.topSpeed} km/h top speed`}
                spotlightColor={car.color}
                onSelect={() => handleSelectCar(car.id)}
              >
                <div className="space-y-3 mt-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary">Acceleration</span>
                    <span style={{ color: COLORS.primary }}>{car.acceleration}/10</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary">Handling</span>
                    <span style={{ color: COLORS.primary }}>{car.handling}/10</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary">Braking</span>
                    <span style={{ color: COLORS.primary }}>{car.braking}/10</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary">Nitro</span>
                    <span style={{ color: COLORS.primary }}>{car.nitro}/10</span>
                  </div>
                  <p className="text-xs text-secondary mt-2 leading-relaxed">
                    {car.description}
                  </p>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Garage;


