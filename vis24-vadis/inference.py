
import json
from sklearn.cluster import KMeans
import torch
from transformers import AutoTokenizer, AutoModel, BertTokenizerFast
from model.pam import DynamicDocumentEmbeddingModel
from relevance_preserving_map.circular_som import CircularSOM, generate_rr_projection, get_grid_position_som, plot_som_results
import numpy as np
from tqdm import tqdm

import torch
import json
import numpy as np
from transformers import BertTokenizerFast


# Check if GPU is available and set the device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

if __name__ == '__main__':
    pretrained_model_path = './dynamic_document_embedding'

    # Load the model and move it to the GPU
    model = DynamicDocumentEmbeddingModel.from_pretrained(
        pretrained_model_path).to(device)
    model.eval()  # Set the model to evaluation mode

    # Load the tokenizer
    tokenizer = BertTokenizerFast.from_pretrained(pretrained_model_path)

    # Load data
    with open('./data/present.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Extract documents
    documents = [d['content'] for d in data][:64]
    query = [
        'Make it Visible',
    ]

    # Batch size for documents
    doc_batch_size = 64  # Adjust based on memory constraints

    # Process one query at a time
    for i, single_query in enumerate(tqdm(query, desc="Processing queries")):
        # Tokenize the single query and move tensors to the GPU
        query_inputs = tokenizer([single_query], return_tensors='pt', max_length=512,
                                 truncation=True, padding='max_length')
        query_input_ids = query_inputs['input_ids'].to(device)
        query_attention_mask = query_inputs['attention_mask'].to(device)

        # Initialize lists to store results for this query
        all_doc_embeddings = []
        all_relevance_scores = []

        # Process documents in batches for the current query
        for j in tqdm(range(0, len(documents), doc_batch_size), desc="Processing documents", leave=False):
            batch_docs = documents[j:j + doc_batch_size]

            # Tokenize the batch of documents and move tensors to the GPU
            doc_inputs = tokenizer(batch_docs, return_tensors='pt', max_length=512,
                                   truncation=True, padding='max_length', return_attention_mask=True)
            doc_input_ids = doc_inputs['input_ids'].to(device)
            doc_attention_mask = doc_inputs['attention_mask'].to(device)

            # Get document embeddings and relevance scores for the batch
            with torch.no_grad():
                doc_embeddings, _, relevance_scores = model.get_document_embedding(
                    query_input_ids=query_input_ids,
                    query_attention_mask=query_attention_mask,
                    doc_input_ids=doc_input_ids,
                    doc_attention_mask=doc_attention_mask
                )

            # Append results to lists (move back to CPU if needed)
            # Move to CPU to save GPU memory
            all_doc_embeddings.extend(doc_embeddings.cpu())
            all_relevance_scores.extend(relevance_scores.cpu())  # Move to CPU

        # Concatenate results for the current query
        doc_embed = torch.cat(all_doc_embeddings,
                              dim=0).numpy().astype(np.float32)
        relevance = torch.cat(all_relevance_scores,
                              dim=0).numpy().astype(np.float32)

        # Initialize Circular SOM for the current query
        som = CircularSOM(
            step=8,                       # Number of neurons in the first layer
            layer=21,                     # Number of layers in the circular grid
            input_len=doc_embed.shape[1],  # Input dimensionality
            sigma=1.5,                    # Initial neighborhood size
            learning_rate=0.7,            # Initial learning rate
            activation_distance='euclidean',
            topology='circular',
            neighborhood_function='gaussian',
            random_seed=10
        )

        # Train the SOM for the current query
        som.train(
            data=doc_embed,
            relevance_score=relevance,
            num_iteration=1000,  # Adjust as needed
            w_s=0.8,          # Weight for similarity
            w_r=0.2,          # Weight for relevance
            verbose=True,
            report_error=True,
            use_sorted=True
        )

        # Get grid positions after training for the current query
        ids_same_order = np.arange(doc_embed.shape[0]).tolist()
        data_grid_positions = get_grid_position_som(
            som, doc_embed, relevance, ids_same_order)

        # save as json
        with open(f"./data/layout/{query[i]}.json", "w") as f:
            json.dump(data_grid_positions, f, indent=2)

        # # kmeans with elbow
        # kmeans = KMeans(n_clusters=7, random_state=42).fit(doc_embed)
        # # pred each input's label
        # labels = kmeans.predict(doc_embed)
        # # save id with labels
        # with open(f"./data/layout/{query[i]}_kmeans.json", "w") as f:
        #     json.dump(labels.tolist(), f, indent=2)

        som, df, df_list = generate_rr_projection(doc_embed, relevance, data)
        # save as json
        with open(f"./data/rr.json", "w") as f:
            json.dump(df_list, f, indent=2)


