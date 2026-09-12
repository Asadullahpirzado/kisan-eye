import os
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, models, transforms
from torch.utils.data import DataLoader

# ==========================================
# CONFIGURATION
# ==========================================
DATASET_DIR = r"D:\kisan-eye-hackathon-ready-source\kisan-eye-hackathon-ready-source\kisan-eye\PlantVillage\PlantVillage"
MODEL_SAVE_PATH = "plant_disease_model.pth"
BATCH_SIZE = 32
NUM_EPOCHS = 5
LEARNING_RATE = 0.001

def train():
    print("Checking for dataset directory...")
    if not os.path.exists(DATASET_DIR):
        print(f"Error: Dataset directory '{DATASET_DIR}' not found.")
        print("Please create a 'dataset/train' folder and place your images in subfolders named after the diseases (e.g. dataset/train/early_blight/img.jpg)")
        return

    train_dir = os.path.join(DATASET_DIR, "train")
    if not os.path.exists(train_dir):
        print(f"Warning: '{train_dir}' not found. Looking for images directly in '{DATASET_DIR}'.")
        train_dir = DATASET_DIR

    print("Setting up device (GPU if available, otherwise CPU)...")
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # Data augmentation and normalization
    data_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(10),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    print("Loading dataset...")
    image_dataset = datasets.ImageFolder(train_dir, data_transforms)
    dataloader = DataLoader(image_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    
    class_names = image_dataset.classes
    num_classes = len(class_names)
    print(f"Found {num_classes} classes: {class_names}")

    if num_classes == 0:
        print("No classes found. Please check your dataset directory structure.")
        return

    print("Loading pre-trained ResNet18 model...")
    model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
    
    # Replace the final fully connected layer to match our number of classes
    num_ftrs = model.fc.in_features
    model.fc = nn.Linear(num_ftrs, num_classes)
    
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

    print("Starting training...")
    for epoch in range(NUM_EPOCHS):
        model.train()
        running_loss = 0.0
        running_corrects = 0

        for inputs, labels in dataloader:
            inputs = inputs.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()

            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            loss = criterion(outputs, labels)

            loss.backward()
            optimizer.step()

            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data)

        epoch_loss = running_loss / len(image_dataset)
        epoch_acc = running_corrects.double() / len(image_dataset)

        print(f"Epoch {epoch+1}/{NUM_EPOCHS} - Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}")

    print("Training complete!")

    print(f"Saving model to {MODEL_SAVE_PATH}...")
    torch.save({
        'class_names': class_names,
        'model_state_dict': model.state_dict(),
    }, MODEL_SAVE_PATH)
    print("Model saved successfully. The backend will now use this model for predictions!")

if __name__ == "__main__":
    train()
