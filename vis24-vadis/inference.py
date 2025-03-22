
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
    documents = [d['content'] for d in data]
    query = [
        "GistVis: Automatic Generation of Word-scale Visualizations from Data-rich Documents\nData-rich documents are ubiquitous in various applications, yet they often rely solely on textual descriptions to convey data insights. Prior research primarily focused on providing visualization-centric augmentation to data-rich documents. However, few have explored using automatically generated word-scale visualizations to enhance the document-centric reading process. As an exploratory step, we propose GistVis, an automatic pipeline that extracts and visualizes data insight from text descriptions. GistVis decomposes the generation process into four modules: Discoverer, Annotator, Extractor, and Visualizer, with the first three modules utilizing the capabilities of large language models and the fourth using visualization design knowledge. Technical evaluation including a comparative study on Discoverer and an ablation study on Annotator reveals decent performance of GistVis. Meanwhile, the user study (N=12) showed that GistVis could generate satisfactory word-scale visualizations, indicating its effectiveness in facilitating users' understanding of data-rich documents (+5.6% accuracy) while significantly reducing their mental demand (p=0.016) and perceived effort (p=0.033).",
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

        som, df, df_list = generate_rr_projection(doc_embed, relevance, data)
        # print(df_list)
        # save as json
        with open(f"./data/rr.json", "w") as f:
            json.dump(df_list, f, indent=2)


