import math
from config import Config

class ScoringService:
    @staticmethod
    def calculate_speed_bonus(remaining_time: float, total_time: float) -> int:
        """
        Calculates speed bonus:
        speed_bonus = floor(50 * remaining_time / total_answer_time)
        Clamped between 0 and 50.
        """
        if total_time <= 0 or remaining_time <= 0:
            return 0
        clamped_rem = min(max(0.0, float(remaining_time)), float(total_time))
        bonus = math.floor(Config.MAX_SPEED_BONUS * (clamped_rem / total_time))
        return int(max(0, min(Config.MAX_SPEED_BONUS, bonus)))

    @staticmethod
    def evaluate_answer(chosen_answer: str, correct_answer: str, time_taken: float, total_time: float):
        """
        Evaluates an answer and calculates points earned.
        Returns: (is_correct, base_points, speed_bonus, total_points)
        """
        if not chosen_answer or chosen_answer.upper() in ("UNANSWERED", "TIMEOUT", "NONE"):
            return False, 0, 0, 0
        
        is_correct = (chosen_answer.strip().upper() == correct_answer.strip().upper())
        if not is_correct:
            return False, 0, 0, 0
            
        remaining_time = max(0.0, total_time - float(time_taken))
        base_points = Config.BASE_POINTS_PER_CORRECT
        speed_bonus = ScoringService.calculate_speed_bonus(remaining_time, total_time)
        total_points = base_points + speed_bonus
        return True, base_points, speed_bonus, total_points
