import { useEffect, useState } from "react";
import CreateGroup from "./CreateGroup";
import EditGroups from "./EditGroups";
import StudyByGroup from "./StudyByGroup";
import { db } from "utils/db";
import type { GroupType } from "types/index";
import "css/App.css"; // Reuse existing styles or add new ones

type GroupsView = "create" | "edit" | "study";

function Groups() {
	const [view, setView] = useState<GroupsView>("create");
	const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
	const [groups, setGroups] = useState<GroupType[]>([]);
	const [currentGroup, setCurrentGroup] = useState<GroupType | null>(null);

	// Load groups for the dropdown
	useEffect(() => {
		db.groups.toArray().then(setGroups);
	}, [view, selectedGroupId]); // Reload when view changes (e.g. after delete/create)

	const handleSelectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value;
		if (value === "create") {
			setView("create");
			setSelectedGroupId(null);
			setCurrentGroup(null);
		} else if (value === "edit") {
			setView("edit");
			setSelectedGroupId(null);
			setCurrentGroup(null);
		} else {
			// It's a group ID
			setView("study");
			setSelectedGroupId(value);
			db.groups.get(value).then((g) => setCurrentGroup(g || null));
		}
	};

    const handleSaveGroup = (group: GroupType) => {
        // After save/update, go to that group's study page
        setSelectedGroupId(group.id);
        setCurrentGroup(group);
        setView("study");
    }

    const handleEditGroup = (groupId: string) => {
        setSelectedGroupId(groupId);
        setView("create"); // Re-use create component for edit
    }

	return (
		<div className="app-container">
            <div className="background">
				<div className="background-base" />
				<div className="background-middle">
					<div className="diagonal-section-middle" />
				</div>
				<div className="background-top">
					<div className="diagonal-section-top" />
				</div>
			</div>
			<div className="content">
				<div className="header">
					<div className="groups-nav">
						<select
							className="groups-selector"
							value={
								view === "create" && !selectedGroupId
									? "create"
									: view === "edit" && !selectedGroupId
									  ? "edit"
									  : selectedGroupId || "create"
							}
							onChange={handleSelectorChange}
						>
							<option value="create">Create Group</option>
							<option value="edit">Edit Groups</option>
							{groups.map((g) => (
								<option key={g.id} value={g.id}>
									{g.name}
								</option>
							))}
						</select>
					</div>
				</div>

				<div className="groups-content">
					{view === "create" && (
						<CreateGroup
							groupId={selectedGroupId || undefined}
							onSave={handleSaveGroup}
						/>
					)}
					{view === "edit" && <EditGroups onEdit={handleEditGroup} />}
					{view === "study" && currentGroup && (
						<StudyByGroup group={currentGroup} />
					)}
				</div>
			</div>
		</div>
	);
}

export default Groups;
