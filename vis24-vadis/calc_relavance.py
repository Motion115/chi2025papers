import numpy as np
from relevance_preserving_map.circular_som import CircularSOM, get_grid_position_som, plot_som_results

# Sample data: Replace with your document embeddings and relevance scores
data = np.random.rand(100, 300)  # Example: 100 documents, 300 features each
relevance = np.random.rand(100)  # Relevance scores for each document
labels = np.arange(0, 100)       # Labels or identifiers for each document

# Initialize Circular SOM
som = CircularSOM(
    step=8,                       # Number of neurons in the first layer
    layer=21,                     # Number of layers in the circular grid
    input_len=data.shape[1],      # Input dimensionality
    sigma=1.5,                    # Initial neighborhood size
    learning_rate=0.7,            # Initial learning rate
    activation_distance='euclidean',
    topology='circular',
    neighborhood_function='gaussian',
    random_seed=10
)

# Train the SOM
som.train(
    data=data,
    relevance_score=relevance,
    num_iteration=1000,  # Adjust as needed
    w_s=0.2,             # Weight for similarity
    w_r=0.8,             # Weight for relevance
    verbose=True,
    report_error=True,
    use_sorted=True
)

# Get grid positions after training
ids_same_order = np.arange(data.shape[0])
data_grid_positions = get_grid_position_som(som, data, relevance, ids_same_order)

# Visualize the results
plot_som_results(som, data, labels, relevance, sort=True)