
import json
import os
from sklearn.cluster import KMeans
import torch
from transformers import AutoTokenizer, AutoModel, BertTokenizerFast
from model.pam import DynamicDocumentEmbeddingModel
from relevance_preserving_map.circular_som import CircularSOM, generate_rr_projection, get_grid_position_som, plot_som_results
import numpy as np
from tqdm import tqdm
import torch.nn.functional as F

# Check if GPU is available and set the device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

# Mean Pooling - Take attention mask into account for correct averaging


# Mean Pooling - Take attention mask into account for correct averaging
def mean_pooling(model_output, attention_mask):
    # First element of model_output contains all token embeddings
    token_embeddings = model_output[0]
    input_mask_expanded = attention_mask.unsqueeze(
        -1).expand(token_embeddings.size()).float()
    return torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)

if __name__ == '__main__':
    tokenizer = AutoTokenizer.from_pretrained(
        'sentence-transformers/all-MiniLM-L6-v2')
    model = AutoModel.from_pretrained('sentence-transformers/all-MiniLM-L6-v2').to(device)

    # Load data
    with open('./data/research_focus_content.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Extract documents
    documents = [d['content'] for d in data]

    embeddings = []

    for i, doc in tqdm(enumerate(documents)):
        # Tokenize sentences
        inputs = tokenizer(doc, padding=True, truncation=True,
                          max_length=512, return_tensors="pt").to(device)

        # Get model output
        with torch.no_grad():
            model_output = model(**inputs)

        # Perform mean pooling
        doc_embed = mean_pooling(model_output, inputs["attention_mask"]).cpu()

        # flatten to 1D, then append to embeddings list
        embeddings.append(doc_embed.flatten())

    # use transform torch
    embeddings = torch.stack(embeddings)
    embeddings = F.normalize(embeddings, p=2, dim=1)

    # save as pt
    torch.save(embeddings, './data/embeddings.pt')


