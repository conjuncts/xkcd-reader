import numpy as np
import matplotlib.pyplot as plt

n = 3100
max_trials = 15000
t_vals = np.arange(0, max_trials)
expected_unique = n * (1 - (1 - 1/n)**t_vals)

# Plotting the expected number of unique items seen as a function of trials

plt.figure(figsize=(8, 8))
plt.plot(t_vals, expected_unique, label="Random (Bernoulli Trials)", color="blue")

# Poisson approximation - see https://people.eecs.berkeley.edu/~jfc/cs174/lecs/lec5/lec5.pdf
poisson_approx = n * (1 - np.exp(-t_vals / n))
plt.plot(t_vals, poisson_approx, label="Random (Poisson Approx)", linestyle="--", color="green")

# clip to [0, n]
ideal = np.arange(0, n + 1)
plt.plot(ideal, ideal, label="Ideally", linestyle=":", color="red")
plt.axhline(n, color="gray", linestyle="--", label="Unique Comics (n=3100)")

plt.xlabel("Number of Trials")
plt.ylabel("Expected Unique Comics Seen")
plt.title("Unique Comics Seen vs Trials (n=3100)")

plt.xlim(0, max_trials)
plt.ylim(0, 3200)

plt.grid(True)
plt.legend()
plt.gca().set_aspect('equal', adjustable='box')
plt.tight_layout()
# plt.show()

plt.savefig("experiments/unique_comics_vs_trials.png", dpi=300, bbox_inches='tight')